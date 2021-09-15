import React, { ReactElement, useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@material-ui/core";

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
	images: Record<string, unknown>[];
	popularity: number;
}

export interface MusicBrainzData {
	id: string;
	type: string;
	gender: string;
	country: string;
	area: Record<string, unknown>;
	birthArea: Record<string, unknown>;
	life: Record<string, unknown>;
	aliases: Record<string, unknown>[];
}

export interface TopArtist {
	name: string;
	ranking: number;
	spotify: {
		popularity: number;
		genres: string[];
		spotifyFollowers: number;
		images: Record<string, unknown>[];
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
	const [loadingArtists, setLoadingArtists] = useState(true);
	const [selectedArea, setSelectedArea] = useState<string | null>(null);
	const [genres, setGenres] = useState<string[]>([]);

	const auth = useContext(AuthContext);

	useEffect(() => {
		auth.apiGet("/api/get-genre-list").then((genresData) => {
			setGenres(genresData);
		});

		if (auth.spotifyIsLoggedIn()) {
			setLoadingArtists(true);

			auth
				.apiGet("/api/get-top-artist-locations")
				.then((artistsData) => {
					setArtists(artistsData);
				})
				.finally(() => setLoadingArtists(false));
		}
	}, []);

	return (
		<div>
			<h1>Artist Finder</h1>

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
				<>
					{loadingArtists && (
						<Loader message="Loading your top Spotify artists..." />
					)}
				</>
			)}

			<div className="map-container">
				<ArtistMap
					artists={artists}
					onSelect={(data) => setSelectedArea(data)}
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
