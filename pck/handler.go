package server

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/gofiber/fiber/v2"
	v1 "github.com/opencontainers/image-spec/specs-go/v1"
	// v1 "github.com/opencontainers/image-spec/specs-go/v1"
	// oras "oras.land/oras-go/v2"
	"oras.land/oras-go/v2/content"
	"oras.land/oras-go/v2/registry/remote"
)

type Result struct {
	Artifact  string
	MediaType string
	Digest    string
	Manifests interface{}
	Configs   interface{}
	Layers    interface{}
}

func GetManifest() fiber.Handler {
	return func(c *fiber.Ctx) error {
		q := c.Queries()
		registryName := q["registry"]
		name := q["name"]

		artifact := registryName + name

		repo, err := remote.NewRepository(artifact)
		if err != nil {
			return c.JSON(err)
		}

		ctx := context.Background()
		var descriptor v1.Descriptor

		_, foundDigest := q["digest"]
		if(foundDigest) {
			descriptor, err = repo.Resolve(ctx, q["digest"])
			artifact = artifact + "@" + q["digest"]
		} else {
			descriptor, err = repo.Resolve(ctx, q["tag"])
			artifact = artifact + ":" + q["tag"]
		}

		if err != nil {
			return c.JSON(err)
		}

		rc, err := repo.Fetch(ctx, descriptor)
		if err != nil {
			return c.JSON(err)
		}
		defer rc.Close()
		pulledBlob, err := content.ReadAll(rc, descriptor)
		if err != nil {
			return c.JSON(err)
		}

		jsonData := string(pulledBlob)

		var data map[string]interface{}
		err = json.Unmarshal([]byte(jsonData), &data)
		if err != nil {
			fmt.Println("Error:", err)
			return c.JSON(err)
		}

		result := Result{
			Artifact:  artifact,
			Manifests: data["manifests"],
			Configs:   data["configs"],
			Layers:    data["layers"],
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