import {
  FaFacebook,
  FaInstagram,
  FaTwitter,
  FaYoutube,
  FaTiktok,
  FaLinkedin,
  FaTelegram,
  FaWhatsapp,
  FaPinterest,
  FaSnapchat,
  FaDiscord,
  FaGithub,
  FaReddit,
  FaTwitch,
  FaSpotify,
} from "react-icons/fa";
import type { IconType } from "react-icons";

export interface PlatformOption {
  value: string;
  label: string;
  icon: IconType;
  color: string;
}

export const platformOptions: PlatformOption[] = [
  { value: "facebook", label: "Facebook", icon: FaFacebook, color: "#1877F2" },
  { value: "instagram", label: "Instagram", icon: FaInstagram, color: "#E4405F" },
  { value: "twitter", label: "Twitter", icon: FaTwitter, color: "#1DA1F2" },
  { value: "x", label: "X", icon: FaTwitter, color: "#000000" },
  { value: "youtube", label: "YouTube", icon: FaYoutube, color: "#FF0000" },
  { value: "tiktok", label: "TikTok", icon: FaTiktok, color: "#000000" },
  { value: "linkedin", label: "LinkedIn", icon: FaLinkedin, color: "#0A66C2" },
  { value: "telegram", label: "Telegram", icon: FaTelegram, color: "#26A5E4" },
  { value: "whatsapp", label: "WhatsApp", icon: FaWhatsapp, color: "#25D366" },
  { value: "pinterest", label: "Pinterest", icon: FaPinterest, color: "#BD081C" },
  { value: "snapchat", label: "Snapchat", icon: FaSnapchat, color: "#FFFC00" },
  { value: "discord", label: "Discord", icon: FaDiscord, color: "#5865F2" },
  { value: "github", label: "GitHub", icon: FaGithub, color: "#181717" },
  { value: "reddit", label: "Reddit", icon: FaReddit, color: "#FF4500" },
  { value: "twitch", label: "Twitch", icon: FaTwitch, color: "#9146FF" },
  { value: "spotify", label: "Spotify", icon: FaSpotify, color: "#1DB954" },
];

export function getPlatformData(platform: string): PlatformOption | null {
  const key = platform.toLowerCase().trim();
  return platformOptions.find((p) => p.value === key) || null;
}
