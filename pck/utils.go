package server

import (
	"context"
	"encoding/json"
	"sync"

	"github.com/gofiber/fiber/v2"
	"github.com/opencontainers/go-digest"
	v1 "github.com/opencontainers/image-spec/specs-go/v1"
	oras "oras.land/oras-go/v2"
	"oras.land/oras-go/v2/content"
	"oras.land/oras-go/v2/registry/remote"
)

const (
	DOWNLOAD    = "download"
	ATSYMBOL    = "@"
	COLONSYMBOL = ":"
)

type Query map[string]string

type ArtifactContent struct {
	Artifact     string
	MediaType    string
	Digest       string
	ArtifactType string
	Size         int64
	Subject      v1.Descriptor
	Manifest     interface{}
	Manifests    interface{}
	Configs      interface{}
	Layers       interface{}
	Annotations  interface{}
}

type Artifact struct {
	Registry   string
	Repository string
	Digest     string
	Tag        string
	Name       string
}

type Referrer struct {
	Ref   v1.Descriptor `json:"ref"`
	Nodes []Referrer    `json:"nodes"`
}

type Blob struct {
	Artifact      string
	ContentLength int64
	ContentType   string
	Digest        string
	Data          interface{}
}

const (
	MediaTypeArtifactManifest = "application/vnd.oci.artifact.manifest.v1+json"
	MediaTypeManifestList     = "application/vnd.docker.distribution.manifest.list.v2+json"
	MediaTypeManifest         = "application/vnd.docker.distribution.manifest.v2+json"
)

type ErrorResponse struct {
	StatusCode int    `json:"status"`
	Message    string `json:"message"`
}

func ArtifactFromQuery(q Query) Artifact {
	a := Artifact{
		Registry:   q["registry"],
		Repository: q["name"],
		Digest:     q["digest"],
		Tag:        q["tag"],
	}

	name := a.Registry + a.Repository
	_, foundDigest := q["digest"]
	if foundDigest {
		name = name + ATSYMBOL + q["digest"]
	} else {
		name = name + COLONSYMBOL + q["tag"]
	}

	a.Name = name
	return a
}

func GenerateReferrerTreeConcurrent(repo *remote.Repository, name string, artifact string) ([]Referrer, error) {
	ctx := context.Background()

	descriptor, err := oras.Resolve(ctx, repo, name, oras.DefaultResolveOptions)
	if err != nil {
		return nil, err
	}

	var wg sync.WaitGroup
	var mu sync.Mutex
	result := []Referrer{}

	if err := repo.Referrers(ctx, descriptor, "", func(referrers []v1.Descriptor) error {
		for _, referrer := range referrers {
			wg.Add(1)
			go func(ref v1.Descriptor) {
				defer wg.Done()

				// FIXME: handle error
				nodes, _ := GenerateReferrerTreeConcurrent(repo, artifact+ATSYMBOL+string(ref.Digest), artifact)
				res := Referrer{
					Ref:   ref,
					Nodes: nodes,
				}

				mu.Lock()
				defer mu.Unlock()
				result = append(result, res)
			}(referrer)
		}
		return nil
	}); err != nil {
		return nil, err
	}

	wg.Wait()
	return result, nil
}

func Err(errorMessage string, statusCode int) ErrorResponse {
	errResponse := ErrorResponse{
		StatusCode: statusCode,
		Message:    errorMessage,
	}
	return errResponse
}

func isJSON(data []byte) bool {
	var js map[string]interface{}
	return json.Unmarshal(data, &js) == nil
}

func isManifest(mediaType string, image string) bool {
	switch mediaType {
	case MediaTypeArtifactManifest,
		MediaTypeManifestList,
		MediaTypeManifest,
		v1.MediaTypeImageManifest,
		v1.MediaTypeImageIndex:

		return true
	default:
		return false
	}
}

func PullManifest(a Artifact) (ArtifactContent, ErrorResponse) {
	artifact := a.Registry + a.Repository
	repo, err := remote.NewRepository(artifact)
	if err != nil {
		return ArtifactContent{}, Err("Repository does not exist", fiber.StatusNotFound)
	}
	ctx := context.Background()
	var descriptor v1.Descriptor
	descriptor, err = oras.Resolve(ctx, repo, a.Name, oras.DefaultResolveOptions)
	if err != nil {
		return ArtifactContent{}, Err("Cannot resolve descriptor with provided reference from the target", fiber.StatusNotFound)
	}
	rc, err := repo.Fetch(ctx, descriptor)
	if err != nil {
		return ArtifactContent{}, Err("Failed to fetch content manifest", fiber.StatusNotFound)
	}
	defer rc.Close()
	pulledBlob, err := content.ReadAll(rc, descriptor)
	if err != nil {
		return ArtifactContent{}, Err("Failed to fetch content manifest", fiber.StatusNotFound)
	}

	jsonData := string(pulledBlob)

	var data map[string]interface{}
	err = json.Unmarshal([]byte(jsonData), &data)
	if err != nil {
		return ArtifactContent{}, Err(err.Error(), fiber.StatusInternalServerError)
	}

	result := ArtifactContent{
		Artifact:    a.Name,
		Manifest:    jsonData,
		Manifests:   data["manifests"],
		Configs:     data["config"],
		Layers:      data["layers"],
		Annotations: data["annotations"],
		Digest:      string(descriptor.Digest),
		MediaType:   string(descriptor.MediaType),
		Size:        int64(descriptor.Size),
	}

	if descriptor.ArtifactType != "" {
		result.ArtifactType = descriptor.ArtifactType
	} else if configData, ok := data["config"].(map[string]interface{}); ok {
		if configMediaType, ok := configData["mediaType"].(string); ok {
			result.ArtifactType = configMediaType
		}
	}

	if subjectData, ok := data["subject"].(map[string]interface{}); ok {
		var subject v1.Descriptor

		subject.MediaType, _ = subjectData["mediaType"].(string)
		if digestStr, ok := subjectData["digest"].(string); ok {
			subject.Digest = digest.Digest(digestStr)
		}
		if sizeFloat, ok := subjectData["size"].(float64); ok {
			subject.Size = int64(sizeFloat)
		}
		result.Subject = subject
	}

	return result, ErrorResponse{}
}
