import {
	TextField,
	Button,
	CircularProgress,
	Card,
	CardContent,
	CardActions,
	Link,
} from "@material-ui/core";
import { Autocomplete } from "@material-ui/lab";
import { useState, useContext, useEffect, ReactElement } from "react";
import AuthContext from "../../context/AuthContext";
import { MusicBrainzData } from "./ArtistFinder";

import "./ArtistsInArea.scss";

interface ArtistsInAreaProps {
	area: string;
	genres: string[];
}

export interface ArtistInArea {
	name: string;
	musicbrainz: MusicBrainzData;
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
		setError(null);

		auth
			.apiGet("/api/get-artists-in-area", {
				area,
				genres: selectedGenres,
			})
			.then((data) => {
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
			<h1>Find artists in {area}</h1>

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
							{artistsInArea.map(
								(artist): ReactElement => (
									<Link
										className="artist"
										href={`https://open.spotify.com/search/${artist.name}`}
										style={{ textDecoration: "none", color: "inherit" }}
									>
										<Card variant="outlined" key={artist.musicbrainz.id}>
											<CardContent>
												<h3>{artist.name}</h3>

												{artist.musicbrainz.aliases &&
													artist.musicbrainz.aliases.length != 0 && (
														<div>
															Also known as{" "}
															{artist.musicbrainz.aliases.map(
																(alias: any, i: number): ReactElement => (
																	<span key={`alias-${i}`} className="alias">
																		{alias.name}
																	</span>
																)
															)}
														</div>
													)}

												{artist.musicbrainz.gender && (
													<div>Gender: {artist.musicbrainz.gender}</div>
												)}

												{artist.musicbrainz.life && (
													<>
														{artist.musicbrainz.life.begin && (
															<div>Born {artist.musicbrainz.life.begin}</div>
														)}
														{artist.musicbrainz.life.end && (
															<div>Died {artist.musicbrainz.life.end}</div>
														)}
													</>
												)}

												{artist.musicbrainz.birthArea && (
													<div>Born in {artist.musicbrainz.birthArea.name}</div>
												)}
											</CardContent>
										</Card>
									</Link>
								)
							)}
						</div>
					)}
				</>
			)}
		</div>
	);
};

export default ArtistsInArea;
