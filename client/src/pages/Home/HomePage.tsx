import { ReactElement, useContext, useEffect, useState } from "react";
import { Button } from "@material-ui/core";
import AuthContext from "../../context/AuthContext";
import "./HomePage.scss";
import { Link } from "react-router-dom";

interface ArtistInterface {
	uri: string;
	name: string;
	links: { [key: string]: string };
	followers: string;
	genres: string[];
	images: any[];
	popularity: number;
}

const TopArtists = (): ReactElement => {
	const [topArtists, setTopArtists] = useState<ArtistInterface[]>();
	const [loading, setLoading] = useState(true);

	const auth = useContext(AuthContext);

	useEffect(() => {
		auth
			.apiGet("/api/get-top-artists")
			.then((data) => {
				setTopArtists(
					data.map((artist: any) => ({
						uri: artist.uri,
						name: artist.name,
						links: artist.external_urls,
						followers: artist.followers,
						genres: artist.genres,
						images: artist.images,
						popularity: artist.popularity,
					}))
				);

				console.log("Got top artists", data);
			})
			.finally(() => setLoading(false));
	}, []);

	console.log("a artists", topArtists);

	return (
		<div>
			<div className="header">Top artists</div>

			{loading ? (
				<h3>Loading...</h3>
			) : topArtists ? (
				<div className="artists">
					{topArtists.map((artist) => {
						return (
							<div className="artist" key={artist.uri}>
								<img
									className="artist-image"
									src={artist.images[0].url}
									alt={`"${artist.name}`}
								/>
								<div className="artist-name">{artist.name}</div>
								{/* <div className="artist-genres">
									{artist.genres.map((genre) => {
										return (
											<div className="artist-genre" key={genre}>
												{genre}
											</div>
										);
									})}
								</div> */}
							</div>
						);
					})}
				</div>
			) : (
				<h3>No top artists found.</h3>
			)}
		</div>
	);
};

const HomePage = (): ReactElement => {
	const auth = useContext(AuthContext);

	return (
		<div className="auth">
			<h1>Welcome</h1>
			{auth.spotifyIsLoggedIn() ? (
				<div>
					<TopArtists />

					<Link to="/auth/logout">
						<Button variant="contained" color="primary">
							Log out of Spotify
						</Button>
					</Link>
				</div>
			) : (
				<Link to="/auth/login">
					<Button variant="contained" color="primary">
						Log in with Spotify
					</Button>
				</Link>
			)}
		</div>
	);
};

export default HomePage;
