import React, { useState, useContext, useEffect, ReactElement } from "react";
import {
	TextField,
	Card,
	CardContent,
	Link,
	makeStyles,
	TablePagination,
} from "@material-ui/core";
import { Autocomplete } from "@material-ui/lab";

import EditableText from "../../components/EditableText/EditableText";
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

const useStyles = makeStyles(() => ({
	fixedCardContent: {
		"&:last-child": {
			paddingBottom: "16px", // fix pointless bottom padding in material-ui cards
		},
	},
}));

interface ArtistCardProps {
	artist: ArtistInArea;
}

const ArtistCard = ({ artist }: ArtistCardProps): ReactElement => {
	const classes = useStyles();

	const artistInfo = () => {
		const elems: ReactElement[] = [];

		if (artist.musicbrainz.gender) {
			elems.push(
				<div key="gender" className="artist-info">
					<div className="info-name">Gender</div>
					<div className="info-value">{artist.musicbrainz.gender}</div>
				</div>
			);
		}

		if (artist.musicbrainz.life) {
			if (artist.musicbrainz.life.begin) {
				elems.push(
					<div key="born" className="artist-info">
						<div className="info-name">
							{artist.musicbrainz.type == "Person" ? "Born" : "Formed"}
						</div>
						<div className="info-value">
							{artist.musicbrainz.life.begin as string}
						</div>
					</div>
				);
			}

			if (artist.musicbrainz.life.end) {
				elems.push(
					<div key="died" className="artist-info">
						<div className="info-name">Died</div>
						<div className="info-value">
							{artist.musicbrainz.life.end as string}
						</div>
					</div>
				);
			}
		}

		if (artist.musicbrainz.birthArea) {
			elems.push(
				<div key="born area" className="artist-info">
					<div className="info-name">Born</div>
					<div className="info-value">
						{artist.musicbrainz.birthArea.name as string}
					</div>
				</div>
			);
		}

		if (elems.length === 0) {
			elems.push(
				<div key="no info" className="artist-info">
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
		>
			<Card variant="outlined">
				<CardContent className={classes.fixedCardContent}>
					<h3>{artist.name}</h3>

					{artist.musicbrainz.aliases &&
						artist.musicbrainz.aliases.length != 0 && (
							<div className="aliases">
								Also known as{" "}
								{artist.musicbrainz.aliases.map(
									(alias, i): ReactElement => (
										<span key={`alias-${i}`} className="alias">
											{alias.name as string}
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
};

const ArtistsInArea = ({ area, genres }: ArtistsInAreaProps): ReactElement => {
	const [artistsInArea, setArtistsInArea] = useState<ArtistInArea[]>();
	const [searched, setSearched] = useState(false);
	const [loading, setLoading] = useState(true);
	const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
	const [manualArea, setManualArea] = useState<string | null>(null);

	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(10);

	const auth = useContext(AuthContext);

	const get = () => {
		setSearched(true);
		setLoading(true);

		auth
			.apiGet("/api/get-artists-in-area", {
				area: manualArea ? manualArea : area,
				genres: selectedGenres,
			})
			.then((data) => {
				setArtistsInArea(data);
			})
			.finally(() => setLoading(false));
	};

	useEffect(() => {
		// new area, get new artists
		setManualArea(null);
		get();
	}, [area]);

	useEffect(() => {
		get();
	}, [selectedGenres]);

	useEffect(() => {
		// manual area now, get new artists
		if (manualArea) get();
	}, [manualArea]);

	return (
		<div className="find-other-artists">
			<h1>
				Artists in{" "}
				<EditableText
					text={area}
					onChange={(newArea) => setManualArea(newArea)}
				/>
			</h1>

			<form
				className="search"
				onSubmit={(e) => {
					get();
					e.preventDefault();
				}}
			>
				<Autocomplete
					multiple
					options={genres}
					filterSelectedOptions
					onChange={(event, value) => setSelectedGenres(value)}
					renderInput={(params) => (
						<TextField
							{...params}
							variant="outlined"
							label="Filter by genre"
							size="small"
						/>
					)}
					style={{ flexGrow: 1 }}
				/>

				{/* <Button variant="contained" color="primary" onClick={() => get()}>
					Search
				</Button> */}
			</form>

			{searched && (
				<>
					{loading ? (
						<Loader message="Finding artists" />
					) : !artistsInArea ? (
						<h2>Failed to get artists</h2>
					) : artistsInArea.length == 0 ? (
						<h2>No artists found</h2>
					) : (
						<div>
							<div className="artists-in-area">
								{artistsInArea
									.slice(page * rowsPerPage, (page + 1) * rowsPerPage)
									.map((artist) => (
										<ArtistCard key={artist.musicbrainz.id} artist={artist} />
									))}

								<TablePagination
									component="div"
									count={artistsInArea.length}
									page={page}
									onPageChange={(e, value) => setPage(value)}
									rowsPerPage={rowsPerPage}
									onRowsPerPageChange={(e) => {
										setRowsPerPage(parseInt(e.target?.value, 10));
										setPage(0);
									}}
								/>
							</div>
						</div>
					)}
				</>
			)}
		</div>
	);
};

export default ArtistsInArea;
