package server

import (
	"fmt"
	"github.com/gofiber/fiber/v2"
)

func AppRouter(app fiber.Router) {
	app.Get("/", homeHandler)
	app.Get("/artifact", artifactHandler)
	app.Get("/blob", blobHandler)
	app.Get("/redirect", redirectHandler)
	app.Get("/api/tags", Tags())
	app.Get("/api/blob", BlobContent())
	app.Get("/api/referrers", Referrers())
	app.Get("/api/artifact", Manifest())
	app.Get("/api/repos", Repos())
	app.Get("*", notFoundHandler)
}

func homeHandler(c *fiber.Ctx) error {
	return c.Render("home", nil)
}

func artifactHandler(c *fiber.Ctx) error {
	return c.Render("artifact", nil)
}

func blobHandler(c *fiber.Ctx) error {
	return c.Render("blob", nil)
}

func redirectHandler(c *fiber.Ctx) error {
	image := c.Query("image")
	mediaType := c.Query("mediatype")

	if isManifest(mediaType, image) {
		return c.Redirect(fmt.Sprintf("/artifact?image=%s", image))
	} else {
		return c.Redirect(fmt.Sprintf("/blob?layer=%s", image))
	}
}

func notFoundHandler(c *fiber.Ctx) error {
	return c.Render("404", nil)
}
