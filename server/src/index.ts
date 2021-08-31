import dotenv from "dotenv";
dotenv.config({ path: "../.env" });

import express, { NextFunction, Request, Response } from "express";
import "express-async-errors";

import morgan from "morgan";
import helmet from "helmet";
import path from "path";

// setup
const app = express();

const port = process.env.PORT || 3001;
const env = process.env.NODE_ENV || "development";

// middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(morgan("tiny"));
app.use(
	helmet({
		contentSecurityPolicy: false,
	})
);

// handle server routes
import apiRouter, { ApiError } from "./routes/api";
app.use("/api", apiRouter);

// serve react app (production)
if (env == "production") {
	const root = path.join(__dirname, "client");

	app.use(express.static(root));
	app.get("*", (req, res) => {
		res.sendFile("index.html", { root });
	});
}

// error handlers
app.use((req: Request, res: Response, next: NextFunction) => {
	// 404s
	res.status(404).json({
		error: true,
		message: "Not Found",
	});
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
	// general
	const dev = req.app.get("env") === "development";
	const errStatus = err.status || 500;
	const errMessage =
		err instanceof ApiError || dev
			? err.message
			: "An unexpected error has occurred, please try again later";

	console.log(err);

	res.status(errStatus).json({
		error: true,
		message: errMessage,
	});
});

// start server
app
	.listen(port, () => {
		console.log(`App started on port ${port} (${env})`);
	})
	.on("error", (e) => {
		console.log(`Fatal error: ${e.message}`);
	});
