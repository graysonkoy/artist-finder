import { ReactElement, useContext, useEffect, useState } from "react";
import {
	Button,
	CircularProgress,
	FormControl,
	InputLabel,
	MenuItem,
	Select,
	TextField,
} from "@material-ui/core";
import Autocomplete from "@material-ui/lab/Autocomplete";
import AuthContext from "../../context/AuthContext";
import { Link } from "react-router-dom";
import {
	MapContainer,
	Marker,
	Popup,
	TileLayer,
	useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import axios from "axios";

import "leaflet/dist/leaflet.css";
import "./HomePage.scss";

const icon = L.icon({
	iconUrl: "/leaflet/marker-icon.png",
	iconAnchor: [13, 41],
});

const iconYours = L.icon({
	iconUrl: "/leaflet/marker-icon-you.png",
	iconAnchor: [13, 41],
});

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
		setLoading(true);

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
			})
			.finally(() => setLoading(false));
	}, []);

	return (
		<div>
			<div className="header">Top artists</div>

			{loading ? (
				<CircularProgress className="loader" />
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
								<br />
								<div className="artist-name">{artist.name}</div>
								<div className="artist-genres">
									{artist.genres.map((genre) => {
										return (
											<div className="artist-genre" key={genre}>
												{genre}
											</div>
										);
									})}
								</div>
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

interface MusicBrainzData {
	id: string;
	gender: string;
	country: string;
	area: any;
	birthArea: any;
	life: any;
	aliases: any;
}

interface TopArtist {
	name: string;
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

interface ArtistInArea {
	name: string;
	musicbrainz: MusicBrainzData;
}

interface YourLocationMarkerProps {
	onSelect: (area: string) => void;
	onDeselect: () => void;
}

const YourLocationMarker = ({
	onSelect,
	onDeselect,
}: YourLocationMarkerProps): ReactElement => {
	const [position, setPosition] = useState<any | null>(null);
	const [area, setArea] = useState<string | null>(null);

	const auth = useContext(AuthContext);

	useEffect(() => {
		auth.apiGet("/api/get-location").then((location) => {
			setPosition([location.latitude, location.longitude]);
			setArea(location.city);
		});
	}, []);

	return (
		position &&
		area && (
			<Marker
				icon={iconYours}
				position={position as any}
				eventHandlers={{
					click: (e) => {
						onSelect(area);
					},
				}}
			>
				<Popup>
					<h3>{area}</h3>
					<div>Your location</div>
				</Popup>
			</Marker>
		)
	);
};

interface ArtistMapProps {
	artists?: TopArtist[];
	onSelect: (data: string) => void;
	onDeselect: () => void;
}

const Map = ({
	artists,
	onSelect,
	onDeselect,
}: ArtistMapProps): ReactElement => {
	const getArtistPos = (artist: TopArtist) => [
		artist.openstreetmap.latitude,
		artist.openstreetmap.longitude,
	];

	const artistsPopup = (area: string, artists: TopArtist[]) => {
		let elems: ReactElement[] = [];

		elems.push(<h2 key="title">Artists in {area}</h2>);

		for (const artist of artists) {
			elems.push(<h3 key="name">{artist.name}</h3>);

			if (artist.musicbrainz.area)
				elems.push(<div key="from">From {artist.musicbrainz.area.name}</div>);

			if (artist.musicbrainz.birthArea)
				elems.push(
					<div key="born-in">Born in {artist.musicbrainz.birthArea.name}</div>
				);
		}

		return <Popup className="artist-popup">{elems}</Popup>;
	};

	// group up artists
	let artistsInAreas: any = {};
	if (artists) {
		for (const artist of artists) {
			const area: string = artist.musicbrainz.area.name;
			if (!(area in artistsInAreas)) artistsInAreas[area] = [];
			artistsInAreas[area].push(artist);
		}
	}

	return (
		<div className="map">
			<MapContainer
				center={[30.8581238, -13.0710475]}
				zoom={2}
				scrollWheelZoom={true}
			>
				<TileLayer
					attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
					url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
				/>

				<YourLocationMarker onSelect={onSelect} onDeselect={onDeselect} />

				{Object.entries(artistsInAreas).map(([area, artist]: [any, any]) => {
					return (
						<Marker
							icon={icon}
							key={`${area} marker`}
							position={getArtistPos(artist[0]) as any}
							eventHandlers={{
								click: (e) => {
									onSelect(area);
								},
							}}
						>
							{artistsPopup(area, artist)}
						</Marker>
					);
				})}
			</MapContainer>
		</div>
	);
};

interface ArtistsInAreaProps {
	area: string;
	genres: string[];
}

const ArtistsInArea = ({ area, genres }: ArtistsInAreaProps) => {
	const [artistsInArea, setArtistsInArea] = useState<ArtistInArea[]>();
	const [searched, setSearched] = useState(false);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

	const auth = useContext(AuthContext);

	const get = () => {
		setSearched(true);
		setLoading(true);

		auth
			.apiGet("/api/get-artists-in-area", {
				area,
				genres: selectedGenres,
			})
			.then((data) => {
				console.log("Got artists", data);
				setArtistsInArea(data);
			})
			.catch((e) => setError(e.message))
			.finally(() => setLoading(false));
	};

	useEffect(() => {
		get();
	}, [area]);

	return (
		<div className="find-other-artists">
			<h1>Find other artists in {area}</h1>

			<div className="search" style={{ gap: "1rem", alignItems: "stretch" }}>
				<Autocomplete
					multiple
					options={genres}
					filterSelectedOptions
					onChange={(event, value) => setSelectedGenres(value)}
					renderInput={(params: any) => (
						<TextField
							{...params}
							variant="outlined"
							label="Filter by genre"
							size="small"
						/>
					)}
					style={{ flexGrow: 1 }}
				/>

				<Button variant="contained" color="primary" onClick={() => get()}>
					Search
				</Button>
			</div>

			<br />
			<br />

			{searched && (
				<>
					{loading ? (
						<CircularProgress className="loader" />
					) : error ? (
						<h2>Error: {error}</h2>
					) : !artistsInArea ? (
						<h2>Failed to get artists</h2>
					) : artistsInArea.length == 0 ? (
						<h2>No artists found</h2>
					) : (
						<div className="artists-in-area">
							{artistsInArea.map((artist) => {
								return (
									<div className="artist" key={artist.musicbrainz.id}>
										<h3>{artist.name}</h3>

										{artist.musicbrainz.birthArea && (
											<div>Born in {artist.musicbrainz.birthArea.name}</div>
										)}

										{artist.musicbrainz.gender && (
											<div>{artist.musicbrainz.gender}</div>
										)}
									</div>
								);
							})}
						</div>
					)}
				</>
			)}
		</div>
	);
};

const Test = (): ReactElement => {
	const [artists, setArtists] = useState<TopArtist[]>();
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selectedArea, setSelectedArea] = useState<string | null>(null);
	const [genres, setGenres] = useState<string[]>([]);

	const auth = useContext(AuthContext);

	useEffect(() => {
		setLoading(true);

		Promise.all([
			auth.apiGet("/api/get-top-artist-locations"),
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
			<h1>Your top artists on Spotify</h1>

			{loading ? (
				<CircularProgress className="loader" />
			) : error ? (
				<h2>Error: {error}</h2>
			) : !artists ? (
				<h2>Failed to get artists</h2>
			) : null}

			<Map
				artists={artists}
				onSelect={(data) => setSelectedArea(data)}
				onDeselect={() => setSelectedArea(null)}
			/>

			{selectedArea && <ArtistsInArea area={selectedArea} genres={genres} />}
		</div>
	);
};

const HomePage = (): ReactElement => {
	const auth = useContext(AuthContext);

	return (
		<div className="auth">
			<h1>Welcome</h1>

			{auth.spotifyIsLoggedIn() ? (
				<Link to="/auth/logout">
					<Button variant="contained" color="primary">
						Log out of Spotify
					</Button>
				</Link>
			) : (
				<Link to="/auth/login">
					<Button variant="contained" color="primary">
						Log in with Spotify
					</Button>
				</Link>
			)}

			<br />
			<br />

			{auth.spotifyIsLoggedIn() && (
				<div>
					{/* <TopArtists /> */}
					<Test />
				</div>
			)}
		</div>
	);
};

export default HomePage;
