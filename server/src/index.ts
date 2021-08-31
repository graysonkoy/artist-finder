import dotenv from "dotenv";
dotenv.config({ path: "../.env" });

import express, { NextFunction, Request, Response } from "express";
import "express-async-errors";

import morgan from "morgan";
import helmet from "helmet";

// setup
const app = express();
const port = process.env.PORT || 3001;

// middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(morgan("tiny"));
app.use(helmet());

// routes
import apiRouter, { ApiError } from "./routes/api";
app.use("/api", apiRouter);

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
		console.log(`App started on port ${port}`);
	})
	.on("error", (e) => {
		console.log(`Fatal error: ${e.message}`);
		process.exit();
	});
