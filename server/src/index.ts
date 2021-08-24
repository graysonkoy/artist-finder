import express, { NextFunction, Request, Response } from "express";
import morgan from "morgan";
import helmet from "helmet";

import "dotenv/config";

// setup
const app = express();
const port = process.env.PORT || 3001;

// middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(morgan("tiny"));
app.use(helmet());

// routes
import apiRouter from "./routes/api";
app.use("/api", apiRouter);

// error handlers
app.use((req, res, next) => {
	// 404s
	res.status(404).json({
		error: true,
		message: "Not Found",
	});
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
	// general
	let dev = req.app.get("env") === "development";
	let errStatus = err.status || 500;

	res.status(errStatus).json({
		error: true,
		message: dev ? err.message : "An unknown error occurred",
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
