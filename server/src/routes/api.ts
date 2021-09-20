import express, { response, Router } from "express";
import { query } from "express-validator";
import { MusicBrainzApi } from "musicbrainz-api";
import axios from "axios";
import validateQuery from "../util/validateQuery";

import genres from "../data/genres.json";

const mbApi = new MusicBrainzApi({
	appName: "CAB432 Assignment 1",
	appVersion: "1.0.0",
	appContactInfo: "n10480811@qut.edu.au",
});

const apiRouter = express.Router();

export class ApiError extends Error {
	status: number;
	raw?: Error;

	constructor(message: string, status: number, error?: Error) {
		super(message);
		this.status = status;
		this.raw = error;
	}
}

apiRouter.get("/spotify/getAuthUrl", (req, res) => {
	const baseUrl = "https://accounts.spotify.com";
	const scopes = ["user-top-read"];

	const url = `${baseUrl}/authorize?client_id=${process.env.SPOTIFY_CLIENT_ID}&response_type=code&redirect_uri=${process.env.SPOTIFY_REDIRECT_URI}&scope=${scopes}`;

	return res.json({
		error: false,
		data: url,
	});
});

apiRouter.get(
	"/spotify/auth",

	query("authCode").isString(),

	async (req, res) => {
		const { authCode } = validateQuery(req);

		const data = {
			grant_type: "authorization_code",
			code: authCode,
			redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
			client_id: process.env.SPOTIFY_CLIENT_ID,
			client_secret: process.env.SPOTIFY_CLIENT_SECRET,
		};

		try {
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
			throw new ApiError(
				"Failed to authorise Spotify session, try logging in again.",
				400,
				e
			);
		}
	}
);

const spotifyHeaders = (accessToken: string) => ({
	headers: {
		Authorization: `Bearer ${accessToken}`,
	},
});

apiRouter.get(
	"/get-location",

	query("latitude").isNumeric(),
	query("longitude").isNumeric(),

	async (req, res) => {
		const { latitude, longitude } = validateQuery(req);

		try {
			const locRes = await axios.get(
				`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
			);

			if (locRes.data.error) throw locRes.data.error;

			return res.json({
				error: false,
				data: locRes.data,
			});
		} catch (e) {
			throw new ApiError("Failed to load location", 400, e);
		}
	}
);

apiRouter.get("/get-my-location", async (req, res) => {
	try {
		const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
		const ipRes: any = await axios.get(
			`https://freegeoip.app/json/${ip != "127.0.0.1" ? ip : ""}`
		);

		return res.json({
			error: false,
			data: ipRes.data,
		});
	} catch (e) {
		throw new ApiError("Failed to get your location", 500, e);
	}
});

apiRouter.get(
	"/get-genre-list",

	async (req, res) => {
		try {
			return res.json({
				error: false,
				data: genres,
			});
		} catch (e) {
			throw new ApiError("Failed to get genres", 500, e);
		}
	}
);

apiRouter.get(
	"/get-artists-in-area",

	query("area").isString(),
	query("genres").optional().isArray(),
	query("numArtists").default(50).isInt({ min: 1, max: 50 }),

	async (req, res) => {
		const { area, genres, numArtists } = validateQuery(req);

		console.log(`Getting artists in ${area}`);

		let artists: any[] = [];

		let mbAreaRes;
		try {
			mbAreaRes = await mbApi.searchArea(area, 0, 1);
		} catch (e) {
			throw new ApiError("Failed to load area", 400, e);
		}

		if (mbAreaRes.areas.length != 0) {
			const area = mbAreaRes.areas[0].name;

			let query = "";
			if (genres) {
				query = `area:"${area}" AND (${genres
					.map((genre: any) => `genre:"${genre}"`)
					.join(" OR ")})`;
			} else {
				query = `area:"${area}"`;
			}

			let mbRes;
			try {
				mbRes = await mbApi.searchArtist(query, 0, numArtists);
			} catch (e) {
				throw new ApiError(`Failed to find artists in area '${area}'`, 400, e);
			}

			// // sort artists by the amount of data there is on them
			// mbRes.artists = mbRes.artists.sort(
			// 	(a, b) => Object.keys(b).length - Object.keys(a).length
			// );

			artists = mbRes.artists.map((artist) => ({
				name: artist.name,
				musicbrainz: {
					id: artist.id,
					type: artist.type,
					gender: artist.gender,
					country: artist.country,
					area: artist.area,
					birthArea: artist.begin_area,
					life: artist["life-span"],
					aliases: artist.aliases,
				},
			}));
		}

		console.log(`Done, got ${artists.length} artists`);

		return res.json({
			error: false,
			data: artists,
		});
	}
);

apiRouter.get(
	"/get-top-artist-locations",

	query("spotifyAccessToken").isString(),
	query("topArtistTimeRange").default("long_term").isString(),
	query("numTopArtists").default(25).isInt({ min: 1, max: 50 }),

	async (req, res) => {
		const { spotifyAccessToken, topArtistTimeRange, numTopArtists } =
			validateQuery(req);

		// get top spotify artists
		console.log("Getting top Spotify artists...");

		let spotifyArtists = [];
		try {
			const spotifyRes = await axios.get(
				`https://api.spotify.com/v1/me/top/artists?time_range=${topArtistTimeRange}&limit=${numTopArtists}`,
				spotifyHeaders(spotifyAccessToken)
			);

			spotifyArtists = spotifyRes.data.items;
		} catch (e) {
			throw new ApiError("Failed to get top Spotify artists", 400, e);
		}

		console.log(`Got ${spotifyArtists.length} artists`);

		// get extra information about each artist
		console.log("Getting extra information about each artist...");

		const artistPromises: Promise<any>[] = [];
		for (const [rankIndex, spotifyData] of spotifyArtists.entries()) {
			artistPromises.push(
				new Promise(async (resolve) => {
					// musicbrainz data
					const mbRes = await mbApi.searchArtist(spotifyData.name, 0, 1);

					if (mbRes.artists.length == 0) throw "No artists found";

					const mbData = mbRes.artists[0];

					resolve({
						name: spotifyData.name,
						ranking: rankIndex + 1,
						spotify: {
							popularity: spotifyData.popularity,
							genres: spotifyData.genres,
							spotifyFollowers: spotifyData.followers.total,
							images: spotifyData.images,
							urls: spotifyData.external_urls,
						},
						musicbrainz: {
							id: mbData.id,
							type: mbData.type,
							gender: mbData.gender,
							country: mbData.country,
							area: mbData.area,
							birthArea: mbData.begin_area,
							life: mbData["life-span"],
							aliases: mbData.aliases,
						},
					});
				})
			);
		}

		const artists = await Promise.all(artistPromises);

		if (artists.length == 0)
			throw new ApiError("Failed to get artist data", 500);

		console.log(`Done`);

		// get openstreetmap data for each area
		const locationPromises: Promise<any>[] = [];

		const areas = [
			...new Set(artists.map((artist) => artist.musicbrainz.area.name)),
		];

		if (areas.length > 0) {
			console.log(
				`Getting location data for ${areas.length} artist's areas...`
			);

			for (const area of areas) {
				locationPromises.push(
					new Promise(async (resolve) => {
						// openstreetmap data
						const osmRes = await axios.get(
							`https://nominatim.openstreetmap.org/search?q=${area}&limit=1&format=json`
						);

						if (osmRes.data.error) throw osmRes.data.error;

						if (osmRes.data.length == 0)
							throw `Couldn't get OpenStreetMap data for area '${area}'`;

						const osmData = osmRes.data[0];
						resolve({ area: area, data: osmData });
					})
				);
			}

			const locations = await Promise.all(locationPromises);

			if (locations.length == 0)
				throw new ApiError("Failed to get artist location data", 500);

			// add location data to artists
			for (const location of locations) {
				for (const artist of artists) {
					if (artist.musicbrainz.area.name == location.area) {
						artist.openstreetmap = {
							latitude: location.data.lat,
							longitude: location.data.lon,
							geojson: location.data.geojson,
						};
					}
				}
			}
		}

		console.log(`Done`);

		return res.json({
			error: false,
			data: artists,
		});
	}
);

export default apiRouter;
