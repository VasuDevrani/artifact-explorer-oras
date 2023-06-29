package server

import "github.com/gofiber/fiber/v2"

type FormData struct {
	Registry string
	Name     string
	Digest   string
	Tag 	 string
}

func AppRouter(app fiber.Router) {
	app.Get("/web", func(c *fiber.Ctx) error {
        return c.Render("home", nil)
    })

	app.Get("/web/artifact", func(c *fiber.Ctx) error {
        return c.Render("artifact", nil)
    })

	app.Post("/web/artifact", func(c *fiber.Ctx) error {
		registry := c.FormValue("registry")
		name := c.FormValue("name")
		digest := c.FormValue("digest")
		tag := c.FormValue("tag")

		formData := FormData{
			Registry: registry,
			Name:     name,
			Digest:   digest,
			Tag: tag,
		}

        return c.Render("artifact", formData)
    })

	app.Get("/artifact", GetManifest2())
}