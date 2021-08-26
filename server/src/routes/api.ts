import express, { response, Router } from "express";
import { query, validationResult } from "express-validator";
import axios from "axios";

const apiRouter = express.Router();

apiRouter.get(
	"/spotify/auth",

	query("authCode").isString(),

	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty())
			return res.status(400).json({ errors: errors.array() });

		const { authCode } = req.query;

		try {
			const data = {
				grant_type: "authorization_code",
				code: authCode,
				redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
				client_id: process.env.SPOTIFY_CLIENT_ID,
				client_secret: process.env.SPOTIFY_CLIENT_SECRET,
			};

			const response = await axios.post(
				"https://accounts.spotify.com/api/token",
				new URLSearchParams(data),
				{
					headers: { "Content-Type": "application/x-www-form-urlencoded" },
				}
			);

			return res.json({
				error: false,
				data: {
					token: response.data.access_token,
				},
			});
		} catch (e) {
			console.log(e.response.data);
			throw e;
		}
	}
);

const spotifyHeaders = (accessToken: string) => ({
	headers: {
		Authorization: `Bearer ${accessToken}`,
	},
});

apiRouter.get(
	"/get-artists",

	query("spotifyAccessToken").isString(),
	query("topArtistTimeRange").default("long_term").isString(),
	query("numTopArtists").default(3).isInt({ min: 1, max: 50 }),

	async (req, res, next) => {
		const errors = validationResult(req);
		if (!errors.isEmpty())
			return res.status(400).json({ errors: errors.array() });

		const { spotifyAccessToken, topArtistTimeRange, numTopArtists } = req.query;

		// get top spotify artists
		try {
			const topArtists = (await axios.get(
				`https://api.spotify.com/v1/me/top/artists?time_range=${topArtistTimeRange}&limit=${numTopArtists}`,
				spotifyHeaders(spotifyAccessToken)
			)).data.items;

			console.log("top artists", topArtists);
	
			// get artist locations
			for (const artist of topArtists) {
				const response = await axios.get(
					`https://api.musixmatch.com/ws/1.1/artist.search?artist=${artist.name}&page_size=1`,
					musixMatch(spotifyAccessToken)
				);

				response.data.message
				
				console.log(response);
			}
		} catch(e) {
			console.log(e);
		}

		return res.json({
			error: false,
			data: [],
		});
	}
);

export default apiRouter;
