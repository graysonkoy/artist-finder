import { useState, useContext, useEffect, ReactElement } from "react";
import {
	TextField,
	Button,
	Card,
	CardContent,
	Link,
	makeStyles,
} from "@material-ui/core";
import { Autocomplete } from "@material-ui/lab";

import Loader from "../../components/Loader/Loader";
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

const useStyles = makeStyles((theme) => ({
	fixedCardContent: {
		"&:last-child": {
			paddingBottom: "16px", // -_-
		},
	},
}));

const ArtistsInArea = ({ area, genres }: ArtistsInAreaProps) => {
	const [artistsInArea, setArtistsInArea] = useState<ArtistInArea[]>();
	const [searched, setSearched] = useState(false);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

	const classes = useStyles();

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
			<h1>Artists in {area}</h1>

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

			{searched && (
				<>
					{loading ? (
						<Loader />
					) : error ? (
						<h2>Error: {error}</h2>
					) : !artistsInArea ? (
						<h2>Failed to get artists</h2>
					) : artistsInArea.length == 0 ? (
						<h2>No artists found</h2>
					) : (
						<div className="artists-in-area">
							{artistsInArea.map((artist): ReactElement => {
								const artistInfo = () => {
									let elems: ReactElement[] = [];

									if (artist.musicbrainz.gender) {
										elems.push(
											<div className="artist-info">
												<div className="info-name">Gender</div>
												<div className="info-value">
													{artist.musicbrainz.gender}
												</div>
											</div>
										);
									}

									if (artist.musicbrainz.life) {
										if (artist.musicbrainz.life.begin) {
											elems.push(
												<div className="artist-info">
													<div className="info-name">Born</div>
													<div className="info-value">
														{artist.musicbrainz.life.begin}
													</div>
												</div>
											);
										}

										if (artist.musicbrainz.life.end) {
											elems.push(
												<div className="artist-info">
													<div className="info-name">Died</div>
													<div className="info-value">
														{artist.musicbrainz.life.end}
													</div>
												</div>
											);
										}
									}

									if (artist.musicbrainz.birthArea) {
										elems.push(
											<div className="artist-info">
												<div className="info-name">Born</div>
												<div className="info-value">
													{artist.musicbrainz.birthArea.name}
												</div>
											</div>
										);
									}

									if (elems.length == 0) {
										elems.push(
											<div className="artist-info">
												<div className="info-none">No information found</div>
											</div>
										);
									}

									return elems;
								};

								return (
									<Link
										className="artist"
										href={`https://open.spotify.com/search/${artist.name}`}
										style={{ textDecoration: "none", color: "inherit" }}
									>
										<Card variant="outlined" key={artist.musicbrainz.id}>
											<CardContent className={classes.fixedCardContent}>
												<h3>{artist.name}</h3>

												{artist.musicbrainz.aliases &&
													artist.musicbrainz.aliases.length != 0 && (
														<div className="aliases">
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

												{artistInfo()}
											</CardContent>
										</Card>
									</Link>
								);
							})}
						</div>
					)}
				</>
			)}
		</div>
	);
};

export default ArtistsInArea;
