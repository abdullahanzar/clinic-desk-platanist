import Image from "next/image";

export default function PublicLoading() {
  return (
    <div className="flex h-full min-h-[60vh] w-full flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        <div className="relative h-24 w-24 animate-pulse">
          <Image
            src="/platanist_clinic_desk_minimal.png"
            alt="Loading..."
            fill
            className="object-contain"
            priority
          />
        </div>
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 animate-bounce rounded-full bg-brand-500 [animation-delay:-0.3s]"></div>
          <div className="h-2 w-2 animate-bounce rounded-full bg-brand-500 [animation-delay:-0.15s]"></div>
          <div className="h-2 w-2 animate-bounce rounded-full bg-brand-500"></div>
        </div>
      </div>
    </div>
  );
}
