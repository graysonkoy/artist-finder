import express, { response, Router } from "express";
import { query, validationResult } from "express-validator";
import { MusicBrainzApi } from "musicbrainz-api";
import axios from "axios";

import genres from "../data/genres.json";
import sample from "../data/sample.json";

const mbApi = new MusicBrainzApi({
	appName: "DSFDS",
	appVersion: "2.5.0",
	appContactInfo: "a4e5au",
});

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
			console.log(e.response);
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
	"/get-location",

	query("latitude").isNumeric(),
	query("longitude").isNumeric(),

	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty())
			return res.status(400).json({ errors: errors.array() });

		const { latitude, longitude } = req.query;

		const locRes = await axios.get(
			`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
		);

		if (locRes.data.error) {
			return res.status(500).json({
				error: true,
				message: locRes.data.error,
			});
		}

		return res.json({
			error: false,
			data: locRes.data,
		});
	}
);

apiRouter.get("/get-my-location", async (req, res) => {
	const ipRes: any = await axios.get("https://freegeoip.app/json/");

	return res.json({
		error: false,
		data: ipRes.data,
	});
});

apiRouter.get(
	"/get-genre-list",

	async (req, res) => {
		return res.json({
			error: false,
			data: genres,
		});
	}
);

apiRouter.get(
	"/get-artists-in-area",

	query("area").isString(),
	query("genres").optional().isArray(),
	query("numArtists").default(50).isInt({ min: 1, max: 50 }),

	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty())
			return res.status(400).json({ errors: errors.array() });

		const { area, genres, numArtists } = req.query;

		let artists: any[] = [];

		console.log(area);

		const mbAreaRes = await mbApi.searchArea(area, 0, 1);
		if (mbAreaRes.areas.length != 0) {
			let query = "";

			if (genres) {
				query = `area:"${mbAreaRes.areas[0].name}" AND (${genres
					.map((genre: any) => `genre:"${genre}"`)
					.join(" OR ")})`;
			} else {
				query = `area:"${mbAreaRes.areas[0].name}"`;
			}

			const mbRes = await mbApi.searchArtist(query, 0, numArtists);

			// // sort artists by the amount of data there is on them
			// mbRes.artists = mbRes.artists.sort(
			// 	(a, b) => Object.keys(b).length - Object.keys(a).length
			// );

			artists = mbRes.artists.map((artist) => ({
				name: artist.name,
				musicbrainz: {
					id: artist.id,
					gender: artist.gender,
					country: artist.country,
					area: artist.area,
					birthArea: artist.begin_area,
					life: artist["life-span"],
					aliases: artist.aliases,
				},
			}));
		}

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
		const errors = validationResult(req);
		if (!errors.isEmpty())
			return res.status(400).json({ errors: errors.array() });

		const { spotifyAccessToken, topArtistTimeRange, numTopArtists } = req.query;

		return res.json(sample);

		// get top spotify artists
		console.log("Getting top Spotify artists...");

		const spotifyRes = (
			await axios.get(
				`https://api.spotify.com/v1/me/top/artists?time_range=${topArtistTimeRange}&limit=${numTopArtists}`,
				spotifyHeaders(spotifyAccessToken)
			)
		).data.items;

		console.log(`Got ${spotifyRes.length} artists`);

		// get extra information about each artist
		console.log("Getting extra information about each artist...");

		let artistPromises: Promise<any>[] = [];
		for (const [rankIndex, spotifyData] of spotifyRes.entries()) {
			artistPromises.push(
				new Promise(async (resolve, reject) => {
					try {
						// musicbrainz data
						const mbRes = await mbApi.searchArtist(spotifyData.name, 0, 1);

						if (mbRes.artists.length == 0) {
							console.log(
								`Couldn't get MusicBrainz data for artist '${spotifyData.name}'`
							);
							return reject();
						}

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
								gender: mbData.gender,
								country: mbData.country,
								area: mbData.area,
								birthArea: mbData.begin_area,
								life: mbData["life-span"],
								aliases: mbData.aliases,
							},
						});
					} catch (e) {
						console.log(e);
						reject(e);
					}
				})
			);
		}

		const artists = await Promise.all(artistPromises);

		console.log(`Done`);

		// get openstreetmap data for each area
		let locationPromises: Promise<any>[] = [];

		const areas = [
			...new Set(artists.map((artist) => artist.musicbrainz.area.name)),
		];

		console.log(`Getting location data for ${areas.length} artist's areas...`);

		for (const area of areas) {
			locationPromises.push(
				new Promise(async (resolve, reject) => {
					try {
						// openstreetmap data
						const osmRes = await axios.get(
							`https://nominatim.openstreetmap.org/search?q=${area}&limit=1&format=json`
						);

						if (osmRes.data.error) return reject(osmRes.data.error);

						if (osmRes.data.length == 0)
							return reject(
								`Couldn't get OpenStreetMap data for area '${area}'`
							);

						const osmData = osmRes.data[0];
						resolve({ area: area, data: osmData });
					} catch (e) {
						console.log(e);
						reject(e);
					}
				})
			);
		}

		const locations = await Promise.all(locationPromises);

		// add location data to artists
		for (const location of locations) {
			for (let artist of artists) {
				if (artist.musicbrainz.area.name == location.area) {
					artist.openstreetmap = {
						latitude: location.data.lat,
						longitude: location.data.lon,
						geojson: location.data.geojson,
					};
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
