const FONT_HREF =
    "https://fonts.googleapis.com/css2?family=Mulish:wght@400;500;600;700&display=swap";

export function setupWebFonts(): Promise<void> {
    if (document.getElementById("mulish-google-fonts")) {
        return Promise.resolve();
    }

    const preconnectGoogle = document.createElement("link");
    preconnectGoogle.rel = "preconnect";
    preconnectGoogle.href = "https://fonts.googleapis.com";
    document.head.appendChild(preconnectGoogle);

    const preconnectGstatic = document.createElement("link");
    preconnectGstatic.rel = "preconnect";
    preconnectGstatic.href = "https://fonts.gstatic.com";
    preconnectGstatic.crossOrigin = "anonymous";
    document.head.appendChild(preconnectGstatic);

    return new Promise((resolve) => {
        const link = document.createElement("link");
        link.id = "mulish-google-fonts";
        link.rel = "stylesheet";
        link.href = FONT_HREF;
        link.onload = () => resolve();
        link.onerror = () => resolve();
        document.head.appendChild(link);
    });
}
