import React, { createContext, FunctionComponent } from "react";
import { useEffect } from "react";
import { useState } from "react";
import { ThemeProvider } from "@material-ui/core/styles";
import { createTheme } from "@material-ui/core";

interface ThemeContextInterface {
	darkTheme: boolean;
	toggleDarkTheme: () => void;
}

const ThemeContext = createContext({} as ThemeContextInterface);

export const ThemeStore: FunctionComponent = ({ children }) => {
	const [darkTheme, setDarkTheme] = useState((): boolean => {
		try {
			return JSON.parse(localStorage.getItem("darkTheme") as string);
		} catch (e) {
			return false;
		}
	});

	useEffect(() => {
		document.documentElement.dataset.theme = `theme-${
			darkTheme ? "dark" : "light"
		}`;
	}, [darkTheme]);

	const toggleDarkTheme = (): void => {
		const newDarkTheme = !darkTheme;
		setDarkTheme(newDarkTheme);
		localStorage.setItem("darkTheme", JSON.stringify(newDarkTheme));
	};

	const theme = createTheme({
		palette: {
			type: darkTheme ? "dark" : "light",
			primary: {
				main: "#AF3E4D",
			},
			secondary: {
				main: "#A97C73",
			},
		},
	});

	return (
		<ThemeContext.Provider value={{ darkTheme, toggleDarkTheme }}>
			<ThemeProvider theme={theme}>{children}</ThemeProvider>
		</ThemeContext.Provider>
	);
};

export default ThemeContext;
