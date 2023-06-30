package server

import "github.com/gofiber/fiber/v2"

type FormData struct {
	Registry string
	Name     string
	Digest   string
	Tag 	 string
}

func AppRouter(app fiber.Router) {
	app.Get("/home", func(c *fiber.Ctx) error {
        return c.Render("home", nil)
    })

	app.Get("/artifact", func(c *fiber.Ctx) error {
        return c.Render("artifact", nil)
    })

	app.Get("/api/artifact", GetManifest())
}