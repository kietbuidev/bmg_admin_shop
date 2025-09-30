import dark from "@/assets/logos/LogoDark.svg";
import light from "@/assets/logos/LogoLight.svg";
import Image from "next/image";

export function Logo() {
  return (
    <div className="relative h-8 max-w-[10.847rem]">
      <Image
        src={dark}
        fill
        className="dark:hidden"
        alt="KAYLIN logo"
        role="presentation" 
        quality={100}
      />

      <Image
        src={light}
        fill
        className="hidden dark:block"
        alt="KAYLIN logo"
        role="presentation"
        quality={100}
      />
    </div>
  );
}
