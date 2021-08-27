import { createContext, FunctionComponent, useEffect, useState } from "react";
import Api from "../utils/server";

export interface AuthContextInterface {
	spotifyGetAuthUrl: () => string;
	spotifyLogin: (newAuth: string | null) => Promise<any>;
	spotifyLogout: () => void;
	spotifyIsLoggedIn: () => boolean;

	apiGet: (url: string, params?: any) => Promise<any>;
}

interface SpotifyTokenInterface {
	authCode: string;
	accessToken: string;
}

const AuthContext = createContext({} as AuthContextInterface);

export const AuthStore: FunctionComponent = ({ children }) => {
	const authEndpoint = "https://accounts.spotify.com/authorize";
	const redirectUri = "http://localhost:3000/auth/redirect/";
	const clientId = "81b902560526439c99e3ee902c0acb5e";

	const scopes = ["user-top-read"];

	const [spotifyTokens, setSpotifyTokens] =
		useState<SpotifyTokenInterface | null>(() => {
			try {
				return JSON.parse(
					localStorage.getItem("spotify-tokens") as string
				) as SpotifyTokenInterface;
			} catch (e) {
				return null;
			}
		});

	useEffect(() => {
		console.log("Storing tokens:", spotifyTokens);

		// store token
		if (spotifyTokens)
			localStorage.setItem("spotify-tokens", JSON.stringify(spotifyTokens));
		else localStorage.removeItem("spotify-tokens");
	}, [spotifyTokens]);

	const spotifyGetAuthUrl = (): string => {
		return `${authEndpoint}?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=${scopes.join(
			" "
		)}`;
	};

	const spotifyLogin = async (authCode: string | null): Promise<any> => {
		try {
			const accessToken = (
				await Api.get("/api/spotify/auth", {
					authCode: authCode,
				})
			).token;

			setSpotifyTokens({
				authCode,
				accessToken,
			} as SpotifyTokenInterface);

			console.log("Set tokens", authCode, accessToken);
		} catch (e) {
			console.log(e);
		}
	};

	const spotifyLogout = (): void => {
		setSpotifyTokens(null);

		console.log("Unset tokens", null);
	};

	const spotifyIsLoggedIn = (): boolean => {
		return !!spotifyTokens;
	};

	const apiGet = async (url: string, params: any = {}): Promise<any> => {
		return await Api.get(url, {
			...params,
			spotifyAccessToken: spotifyTokens ? spotifyTokens.accessToken : null,
		});
	};

	return (
		<AuthContext.Provider
			value={{
				spotifyGetAuthUrl,
				spotifyLogin,
				spotifyLogout,
				spotifyIsLoggedIn,

				apiGet,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
};

export default AuthContext;
