package server

import (
	"context"
	"encoding/json"

	v1 "github.com/opencontainers/image-spec/specs-go/v1"
	oras "oras.land/oras-go/v2"
	"oras.land/oras-go/v2/registry/remote"
)

const (
	TARDOWNLOAD = "tardownload"
	ATSYMBOL    = "@"
	COLONSYMBOL = ":"
)

type Query map[string]string

type ArtifactContent struct {
	Artifact  string
	MediaType string
	Digest    string
	Manifests interface{}
	Configs   interface{}
	Layers    interface{}
}

type Artifact struct {
	Registry   string
	Repository string
	Digest     string
	Tag        string
	Name       string
}

type Referrer struct {
	Ref  v1.Descriptor `json:"ref"`
	Nodes []Referrer    `json:"nodes"`
}

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

func GenerateReferrerTree(repo *remote.Repository, name string, artifact string) ([]Referrer, error) {
	ctx := context.Background()

	descriptor, err := oras.Resolve(ctx, repo, name, oras.DefaultResolveOptions)

	if err != nil {
		return nil, err
	}

	result := []Referrer{}
	if err := repo.Referrers(ctx, descriptor, "", func(referrers []v1.Descriptor) error {
		for _, referrer := range referrers {
			nodes, _ := GenerateReferrerTree(repo, artifact+ATSYMBOL+string(referrer.Digest), artifact)
			res := Referrer{
				Ref:  referrer,
				Nodes: nodes,
			}

			result = append(result, res)
		}
		return nil
	}); err != nil {
		return nil, err
	}
	return result, err
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