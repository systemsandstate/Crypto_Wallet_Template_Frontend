import { useEffect, useState } from "react";

import { setupWebFonts } from "../utils/setupWebFonts";

export function useAppFonts(): boolean {
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        setupWebFonts()
            .catch(() => undefined)
            .finally(() => setLoaded(true));
    }, []);

    return loaded;
}
