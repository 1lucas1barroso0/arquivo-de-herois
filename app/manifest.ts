import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Arquivo de Heróis",
    short_name: "Arquivo de Heróis",
    description: "Crie, confira, salve e compartilhe fichas completas.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f5f7f4",
    theme_color: "#007f91",
    orientation: "any",
    lang: "pt-BR",
    categories: ["games", "utilities", "entertainment"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      {
        name: "Nova ficha",
        short_name: "Nova ficha",
        description: "Criar uma ficha do personagem",
        url: "/?action=new",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Importar ficha",
        short_name: "Importar",
        description: "Importar uma ficha ou link compartilhado",
        url: "/?action=import",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}
