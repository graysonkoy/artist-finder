import React, { ReactElement } from "react";
import { CircularProgress } from "@material-ui/core";

import "./Loader.scss";
import { useState } from "react";
import { useEffect } from "react";

interface LoaderProps {
	messages: string[];
	messageGap?: number;
}

const Loader = ({ messages, messageGap = 5000 }: LoaderProps): ReactElement => {
	const [messageIndex, setMessageIndex] = useState(0);
	const [message, setMessage] = useState("Loading...");

	const getNextMessage = () => {
		setMessageIndex((lastMessageIndex) => lastMessageIndex + 1);
	};

	useEffect(() => {
		setMessage(messages[messageIndex]);

		if (messageIndex + 1 < messages.length)
			setTimeout(() => getNextMessage(), messageGap);
	}, [messageIndex]);

	return (
		<div className="loader">
			<CircularProgress color="secondary" />
			<span>{message}</span>
		</div>
	);
};

export default Loader;
