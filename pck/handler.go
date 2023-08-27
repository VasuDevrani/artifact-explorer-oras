package server

import (
	"archive/tar"
	"bytes"
	"compress/gzip"
	"context"
	"encoding/json"
	"io"

	"github.com/gofiber/fiber/v2"
	"github.com/opencontainers/go-digest"
	v1 "github.com/opencontainers/image-spec/specs-go/v1"
	"oras.land/oras-go/v2/content"

	// "oras.land/oras-go/v2/registry"
	"oras.land/oras-go/v2/registry/remote"
)

// fetch content manifest
func Manifest() fiber.Handler {
	return func(c *fiber.Ctx) error {
		a := ArtifactFromQuery(c.Queries())

		result, errResponse := PullManifest(a)
		if errResponse.Message != "" {
			return c.Status(errResponse.StatusCode).JSON(errResponse)
		}
		return c.JSON(result)
	}
}

// fetch list of tags under a repository
func Tags() fiber.Handler {
	return func(c *fiber.Ctx) error {
		a := ArtifactFromQuery(c.Queries())

		artifact := a.Registry + a.Repository

		repo, err := remote.NewRepository(artifact)
		if err != nil {
			errResponse := Err("Repository does not exist", fiber.StatusNotFound)
			return c.Status(errResponse.StatusCode).JSON(errResponse)
		}

		ctx := context.Background()

		result := []string{}

		err = repo.Tags(ctx, "", func(tags []string) error {
			for _, tag := range tags {
				result = append(result, tag)
			}
			return nil
		})

		if err != nil {
			errResponse := Err("Failed to fetch tags", fiber.StatusNotFound)
			return c.Status(errResponse.StatusCode).JSON(errResponse)
		}
		return c.JSON(result)
	}
}

// recursively fetch referrers of artifact
func Referrers() fiber.Handler {
	return func(c *fiber.Ctx) error {
		a := ArtifactFromQuery(c.Queries())

		artifact := a.Registry + a.Repository

		repo, err := remote.NewRepository(artifact)
		if err != nil {
			errResponse := Err("Repository does not exist", fiber.StatusNotFound)
			return c.Status(errResponse.StatusCode).JSON(errResponse)
		}

		referrers, err := GenerateReferrerTreeConcurrent(repo, a.Name, artifact)

		if err != nil {
			errResponse := Err("Failed to fetch referrers", fiber.StatusNotFound)
			return c.Status(errResponse.StatusCode).JSON(errResponse)
		}

		initial := 1
		for {
			data, err := PullManifest(a)
			if err.Message != "" {
				break
			}

			if initial == 1 {
				referrers = []Referrer{
					{
						Ref: v1.Descriptor{
							MediaType:    data.MediaType,
							Digest:       digest.Digest(data.Digest),
							Size:         data.Size,
							ArtifactType: data.ArtifactType,
						},
						Nodes: referrers,
					},
				}
				initial++
			}

			if data.Subject.Digest == "" {
				break
			}
			dt := Referrer{
				Ref:   data.Subject,
				Nodes: referrers,
			}
			referrers = []Referrer{dt}
			name := a.Registry + a.Repository
			a.Name = name + ATSYMBOL + string(data.Subject.Digest)
		}
		return c.JSON(referrers)
	}
}

// fetch content of artifact blobs (configs or layers)
func BlobContent() fiber.Handler {
	return func(c *fiber.Ctx) error {
		t := c.Queries()["type"]
		a := ArtifactFromQuery(c.Queries())

		artifact := a.Registry + a.Repository

		repo, err := remote.NewRepository(artifact)
		if err != nil {
			errResponse := Err("Repository does not exist", fiber.StatusNotFound)
			return c.Status(errResponse.StatusCode).JSON(errResponse)
		}

		ctx := context.Background()
		descriptor, err := repo.Blobs().Resolve(ctx, a.Name)
		if err != nil {
			errResponse := Err("Cannot resolve descriptor with provided reference from the target", fiber.StatusNotFound)
			return c.Status(errResponse.StatusCode).JSON(errResponse)
		}
		rc, err := repo.Fetch(ctx, descriptor)
		if err != nil {
			errResponse := Err("Failed to fetch contents of artifact blob", fiber.StatusNotFound)
			return c.Status(errResponse.StatusCode).JSON(errResponse)
		}
		defer rc.Close()

		pulledBlob, err := content.ReadAll(rc, descriptor)
		if err != nil {
			errResponse := Err("Failed to fetch contents of artifact blob", fiber.StatusInternalServerError)
			return c.Status(errResponse.StatusCode).JSON(errResponse)
		}
		if t == DOWNLOAD {
			// filename := "file"
			// contentType := ""

			// if isJSON(pulledBlob) {
			// 	filename += ".json"
			// 	contentType = "application/json"
			// } else {
			// 	filename += ".tar"
			// 	contentType = "application/x-tar"
			// }
			c.Set("Content-Type", "application/octet-stream")
			// c.Set("Content-Disposition", "attachment; filename="+filename)

			return c.Send(pulledBlob)
		}

		result := Blob{
			Artifact:      a.Name,
			ContentLength: descriptor.Size,
			Digest:        string(descriptor.Digest),
			ContentType:   string(descriptor.MediaType),
		}

		if(len(pulledBlob) == 0) {
			return c.JSON(result)
		}

		if isJSON(pulledBlob) {
			jsonData := string(pulledBlob)

			var data map[string]interface{}
			err = json.Unmarshal([]byte(jsonData), &data)
			if err != nil {
				errResponse := Err("Failed to fetch contents of artifact blob", fiber.StatusNotFound)
				return c.Status(errResponse.StatusCode).JSON(errResponse)
			}
			
			result.Data = data
			return c.JSON(result)
		} else {
			tarr := bytes.NewReader(pulledBlob)

			gzipReader, err := gzip.NewReader(tarr)
			if err != nil {
				return c.JSON(err)
			}

			tarReader := tar.NewReader(gzipReader)
			data := []string{}
			for {
				header, err := tarReader.Next()
				if err == io.EOF {
					break
				}
				if err != nil {
					return c.JSON(err)
				}
				_ = header.Name

				var buffer bytes.Buffer
				if _, err := io.Copy(&buffer, tarReader); err != nil {
					errResponse := Err("Failed to fetch contents of artifact blob", fiber.StatusNotFound)
					return c.Status(errResponse.StatusCode).JSON(errResponse)
				}

				fileContent := buffer.String()
				data = append(data, fileContent)
			}
			result := Blob{
				Artifact:      a.Name,
				ContentLength: descriptor.Size,
				Digest:        string(descriptor.Digest),
				ContentType:   string(descriptor.MediaType),
				Data:          data,
			}
			return c.JSON(result)
		}
	}
}

func Repos() fiber.Handler {
	return func(c *fiber.Ctx) error {
		a := ArtifactFromQuery(c.Queries())
		reg, err := remote.NewRegistry(a.Registry)
		if err != nil {
			errResponse := Err("Registry does not exist", fiber.StatusNotFound)
			return c.Status(errResponse.StatusCode).JSON(errResponse)
		}
		ctx := context.Background()

		var repoList []string
		err = reg.Repositories(ctx, "", func(repos []string) error {
			for _, repo := range repos {
				repoList = append(repoList, repo)
			}
			return nil
		})

		if err != nil {
			errResponse := Err("Failed to fetch repositories", fiber.StatusNotFound)
			return c.Status(errResponse.StatusCode).JSON(errResponse)
		}

		return c.JSON(repoList)
	}
}
