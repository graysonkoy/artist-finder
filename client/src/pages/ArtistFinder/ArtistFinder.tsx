import { ReactElement, useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button, CircularProgress } from "@material-ui/core";

import Loader from "../../components/Loader/Loader";
import AuthContext from "../../context/AuthContext";

import ArtistsInArea from "./ArtistsInArea";
import ArtistMap from "./ArtistMap";

import "./ArtistFinder.scss";

export interface ArtistInterface {
	uri: string;
	name: string;
	links: { [key: string]: string };
	followers: string;
	genres: string[];
	images: any[];
	popularity: number;
}

export interface MusicBrainzData {
	id: string;
	gender: string;
	country: string;
	area: any;
	birthArea: any;
	life: any;
	aliases: any;
}

export interface TopArtist {
	name: string;
	ranking: number;
	spotify: {
		popularity: number;
		genres: string[];
		spotifyFollowers: number;
		images: any[];
		urls: string[];
	};
	musicbrainz: MusicBrainzData;
	openstreetmap: {
		latitude: number;
		longitude: number;
	};
}

const ArtistFinder = (): ReactElement => {
	const [artists, setArtists] = useState<TopArtist[]>();
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selectedArea, setSelectedArea] = useState<string | null>(null);
	const [genres, setGenres] = useState<string[]>([]);

	const auth = useContext(AuthContext);

	useEffect(() => {
		setLoading(true);
		setError(null);

		console.log("Getting top artists");

		Promise.all([
			auth.spotifyIsLoggedIn()
				? auth.apiGet("/api/get-top-artist-locations")
				: null,
			auth.apiGet("/api/get-genre-list"),
		])
			.then(([artistsData, genresData]) => {
				setArtists(artistsData);
				setGenres(genresData);
			})
			.catch((e) => setError(e.message))
			.finally(() => setLoading(false));
	}, []);

	return (
		<div>
			<h1>Artist Finder</h1>

			{loading ? (
				<Loader />
			) : error ? (
				<h2>Error: {error}</h2>
			) : !artists ? (
				<>
					{!auth.spotifyIsLoggedIn() ? (
						<div className="sign-in-prompt">
							<h3>Log in with Spotify to load your top artists</h3>

							<Link to="/auth/login">
								<Button variant="contained" color="primary" size="small">
									Log in with Spotify
								</Button>
							</Link>
						</div>
					) : (
						<h2>Failed to get your top Spotify artists</h2>
					)}
				</>
			) : null}

			<div className="map-container">
				<ArtistMap
					artists={artists}
					onSelect={(data) => setSelectedArea(data)}
					onDeselect={() => setSelectedArea(null)}
				/>

				<div className="marker-explanations">
					<div className="marker-explanation">
						<img src="/leaflet/marker.svg" alt="Regular marker" />
						<span>Spotify top artist</span>
					</div>
					<div className="marker-explanation">
						<img src="/leaflet/you-marker.svg" alt="Your location's marker" />
						<span>Your location</span>
					</div>
					<div className="marker-explanation">
						<img src="/leaflet/draggable-marker.svg" alt="Draggable marker" />
						<span>Custom location (draggable)</span>
					</div>
				</div>
			</div>

			{selectedArea && <ArtistsInArea area={selectedArea} genres={genres} />}
		</div>
	);
};

export default ArtistFinder;
