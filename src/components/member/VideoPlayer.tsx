export default function VideoPlayer({ src }: { src: string }) {
  return <video src={src} controls className="w-full rounded-md bg-black mt-2 max-h-72" />;
}
