package server

import "github.com/gofiber/fiber/v2"

func AppRouter(app fiber.Router) {
	app.Get("/", func(c *fiber.Ctx) error {
        return c.Render("home", nil)
    })

	app.Get("/artifact", func(c *fiber.Ctx) error {
        return c.Render("artifact", nil)
    })

	app.Get("/blob", func(c *fiber.Ctx) error {
        return c.Render("blob", nil)
    })

	app.Get("/api/tags", Tags())

	app.Get("/api/blob", BlobContent())
	
	app.Get("/api/referrers", Referrers())
	
	app.Get("/api/artifact", Manifest())

	app.Get("/api/repos", Repos())

	app.Get("*", func(c *fiber.Ctx) error {
        return c.Render("404", nil)
    })
}