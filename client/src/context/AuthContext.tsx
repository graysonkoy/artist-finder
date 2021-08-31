import React, {
	createContext,
	FunctionComponent,
	useEffect,
	useState,
	useContext,
} from "react";
import ApiContext from "./ApiContext";

export interface AuthContextInterface {
	spotifyGetAuthUrl: () => Promise<string>;
	spotifyLogin: (newAuth: string | null) => Promise<void>;
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
	const Api = useContext(ApiContext);

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
		// store token
		if (spotifyTokens)
			localStorage.setItem("spotify-tokens", JSON.stringify(spotifyTokens));
		else localStorage.removeItem("spotify-tokens");
	}, [spotifyTokens]);

	const spotifyGetAuthUrl = async (): Promise<string> => {
		return await Api.get("/api/spotify/getAuthUrl");
	};

	const spotifyLogin = async (authCode: string | null): Promise<void> => {
		const accessToken = (
			await Api.get("/api/spotify/auth", {
				authCode: authCode,
			})
		).token;

		setSpotifyTokens({
			authCode,
			accessToken,
		} as SpotifyTokenInterface);
	};

	const spotifyLogout = (): void => {
		setSpotifyTokens(null);
	};

	const spotifyIsLoggedIn = (): boolean => {
		return !!spotifyTokens;
	};

	const apiGet = async (url: string, params = {}): Promise<any> => {
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
