package server

import (
	"archive/tar"
	"bytes"
	"compress/gzip"
	"context"
	"encoding/json"
	// "fmt"
	"io"

	"github.com/gofiber/fiber/v2"
	v1 "github.com/opencontainers/image-spec/specs-go/v1"
	oras "oras.land/oras-go/v2"
	"oras.land/oras-go/v2/content"

	// "oras.land/oras-go/v2/registry"
	"oras.land/oras-go/v2/registry/remote"
)

// fetch content manifest
func Manifest() fiber.Handler {
	return func(c *fiber.Ctx) error {
		a := ArtifactFromQuery(c.Queries())

		artifact := a.Registry + a.Repository

		repo, err := remote.NewRepository(artifact)
		if err != nil {
			errResponse := Err("Repository does not exist", fiber.StatusNotFound)
			return c.Status(errResponse.StatusCode).JSON(errResponse)
		}

		ctx := context.Background()
		var descriptor v1.Descriptor

		descriptor, err = oras.Resolve(ctx, repo, a.Name, oras.DefaultResolveOptions)

		if err != nil {
			errResponse := Err("Cannot resolve descriptor with provided reference from the target", fiber.StatusNotFound)
			return c.Status(errResponse.StatusCode).JSON(errResponse)
		}

		rc, err := repo.Fetch(ctx, descriptor)
		if err != nil {
			errResponse := Err("Failed to fetch content manifest", fiber.StatusNotFound)
			return c.Status(errResponse.StatusCode).JSON(errResponse)
		}
		defer rc.Close()
		pulledBlob, err := content.ReadAll(rc, descriptor)
		if err != nil {
			errResponse := Err("Failed to fetch content manifest", fiber.StatusNotFound)
			return c.Status(errResponse.StatusCode).JSON(errResponse)
		}

		jsonData := string(pulledBlob)

		var data map[string]interface{}
		err = json.Unmarshal([]byte(jsonData), &data)
		if err != nil {
			errResponse := Err(err.Error(), fiber.StatusInternalServerError)
			return c.Status(errResponse.StatusCode).JSON(errResponse)
		}

		result := ArtifactContent{
			Artifact:  a.Name,
			Manifests: data["manifests"],
			Configs:   data["config"],
			Layers:    data["layers"],
			Digest:    a.Digest,
		}

		if mediaType, ok := data["mediaType"].(string); ok {
			result.MediaType = mediaType
		}
		if digest, ok := data["digest"].(string); ok {
			result.Digest = digest
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

		referrers, err := GenerateReferrerTree(repo, a.Name, artifact)

		if err != nil {
			errResponse := Err("Failed to fetch referrers", fiber.StatusNotFound)
			return c.Status(errResponse.StatusCode).JSON(errResponse)
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
		if t == CONFIG {
			jsonData := string(pulledBlob)

			var data map[string]interface{}
			err = json.Unmarshal([]byte(jsonData), &data)
			if err != nil {
				errResponse := Err("Failed to fetch contents of artifact blob", fiber.StatusNotFound)
				return c.Status(errResponse.StatusCode).JSON(errResponse)
			}
			return c.JSON(data)
		} else if t == TAR {
			tarr := bytes.NewReader(pulledBlob)

			gzipReader, err := gzip.NewReader(tarr)
			if err != nil {
				return c.JSON(err)
			}

			tarReader := tar.NewReader(gzipReader)
			result := []string{}
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
				result = append(result, fileContent)
			}
			return c.JSON(result)
		} else if t == TARDOWNLOAD {
			c.Set("Content-Type", "application/x-tar")
			c.Set("Content-Disposition", "attachment; filename=file.tar")

			return c.Send(pulledBlob)
		}
		return nil
	}
}
