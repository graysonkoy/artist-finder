import { ReactElement, useState, useContext, useEffect } from "react";
import AuthContext from "../../context/AuthContext";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

import { TopArtist } from "./ArtistFinder";

import "leaflet/dist/leaflet.css";
import L from "leaflet";

import "./ArtistMap.scss";

const icon = L.icon({
	iconUrl: "/leaflet/marker-icon.png",
	iconAnchor: [10, 33],
	iconSize: [20, 33],
});

const iconYours = L.icon({
	iconUrl: "/leaflet/marker-icon-you.png",
	iconAnchor: [13, 41],
	iconSize: [25, 41],
});

const iconDraggable = L.icon({
	iconUrl: "/leaflet/marker-icon-draggable.png",
	iconAnchor: [10, 33],
	iconSize: [20, 33],
});

interface DraggableMarkerProps {
	startPos: [number, number];
	onSelect: (area: string) => void;
	onDeselect: () => void;
}

const DraggableMarker = ({
	startPos,
	onSelect,
	onDeselect,
}: DraggableMarkerProps): ReactElement => {
	const [position, setPosition] = useState(startPos);

	const auth = useContext(AuthContext);

	useEffect(() => {
		// get area
		auth
			.apiGet("/api/get-location", {
				latitude: position[0],
				longitude: position[1],
			})
			.then((res) => {
				let area;

				if (res.address.city) area = res.address.city;
				else if (res.address.state) area = res.address.state;
				else if (res.address.country) area = res.address.country;

				console.log(area, position);

				if (area) onSelect(area);
			});
	}, [position]);

	return (
		<Marker
			zIndexOffset={200}
			icon={iconDraggable}
			draggable
			position={position}
			eventHandlers={{
				dragend: (e) => {
					const latlng = e.target.getLatLng();
					setPosition([latlng.lat, latlng.lng]);
				},
			}}
		>
			<Popup>
				<h3>Custom location</h3>
				<div>Drag to select a location</div>
			</Popup>
		</Marker>
	);
};

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
		auth.apiGet("/api/get-my-location").then((location) => {
			setPosition([location.latitude, location.longitude]);
			setArea(location.city);
		});
	}, []);

	return (
		position &&
		area && (
			<Marker
				zIndexOffset={100}
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

const ArtistMap = ({
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
			elems.push(
				<h3 key="name">
					#{artist.ranking} - {artist.name}
				</h3>
			);

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

	const center: [number, number] = [30.8581238, -13.0710475];

	// const southWest = L.latLng(-89.98155760646617, -180);
	// const northEast = L.latLng(89.99346179538875, 180);
	// const bounds = L.latLngBounds(southWest, northEast);

	return (
		<div className="map">
			<MapContainer
				center={center}
				zoom={2}
				scrollWheelZoom={true}
				// maxBoundsViscosity={0.5}
				// maxBounds={bounds}
			>
				<TileLayer
					attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
					url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
				/>

				<DraggableMarker
					startPos={[-33.90689555128868, 151.23229980468753]}
					onSelect={onSelect}
					onDeselect={onDeselect}
				/>

				<YourLocationMarker onSelect={onSelect} onDeselect={onDeselect} />

				{Object.entries(artistsInAreas).map(
					([area, artist]: [any, any]): ReactElement => (
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
					)
				)}
			</MapContainer>
		</div>
	);
};

export default ArtistMap;
