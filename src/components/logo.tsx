import logoLightMode from "@/assets/logos/light.png";
import logoDarkMode from "@/assets/logos/dark.png";
import Image from "next/image";

export function Logo() {
  return (
    <div className="relative mx-auto h-20 w-64 max-w-full select-none">
      <Image
        src={logoLightMode}
        fill
        className="object-contain object-center dark:hidden"
        alt="KAYLIN Collection logo"
        role="presentation"
        sizes="(max-width: 768px) 220px, 256px"
        priority
        quality={100}
      />

      <Image
        src={logoDarkMode}
        fill
        className="hidden object-contain object-center dark:block"
        alt="KAYLIN Collection logo"
        role="presentation"
        sizes="(max-width: 768px) 220px, 256px"
        priority
        quality={100}
      />
    </div>
  );
}
