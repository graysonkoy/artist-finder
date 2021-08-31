import React, { useState, useContext, useEffect, ReactElement } from "react";
import {
  TextField,
  Card,
  CardContent,
  Link,
  makeStyles,
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
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [manualArea, setManualArea] = useState<string | null>(null);

  const classes = useStyles();

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

        {/* <Button variant="contained" color="primary" onClick={() => get()}>
					Search
				</Button> */}
      </form>

      {searched && (
        <>
          {loading ? (
            <Loader messages={["Finding artists"]} />
          ) : !artistsInArea ? (
            <h2>Failed to get artists</h2>
          ) : artistsInArea.length == 0 ? (
            <h2>No artists found</h2>
          ) : (
            <div className="artists-in-area">
              {artistsInArea.map((artist): ReactElement => {
                const artistInfo = () => {
                  const elems: ReactElement[] = [];

                  if (artist.musicbrainz.gender) {
                    elems.push(
                      <div key="gender" className="artist-info">
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
                        <div key="born" className="artist-info">
                          <div className="info-name">Born</div>
                          <div className="info-value">
                            {artist.musicbrainz.life.begin}
                          </div>
                        </div>
                      );
                    }

                    if (artist.musicbrainz.life.end) {
                      elems.push(
                        <div key="died" className="artist-info">
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
                      <div key="born area" className="artist-info">
                        <div className="info-name">Born</div>
                        <div className="info-value">
                          {artist.musicbrainz.birthArea.name}
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
                    key={artist.musicbrainz.id}
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
