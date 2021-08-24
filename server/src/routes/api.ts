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

    const authCode = req.query.authCode;

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
  "/get-top-artists",

  query("spotifyAccessToken").isString(),

  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const spotifyAccessToken = req.query.spotifyAccessToken;

    // options
    const timeRange = "long_term";
    const numArtists = 50;

    const response = await axios.get(
      `https://api.spotify.com/v1/me/top/artists?time_range=${timeRange}&limit=${numArtists}`,
      spotifyHeaders(spotifyAccessToken)
    );

    return res.json({
      error: false,
      data: response.data.items,
    });
  }
);

export default apiRouter;
