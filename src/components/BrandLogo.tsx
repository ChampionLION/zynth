import Image from "next/image";
import { ZYNTH_MARK_PATH } from "@/lib/brand";

export function ZynthMark({className=""}:{className?:string}) {
  return <svg className={`zynth-mark ${className}`} viewBox="0 0 816 956" fill="currentColor" aria-hidden="true" focusable="false"><path d={ZYNTH_MARK_PATH}/></svg>;
}

export function BrandLogo({tone="ink",className="",priority=false}:{tone?:"ink"|"light";className?:string;priority?:boolean}) {
  return <span className={`zynth-logo zynth-logo--${tone} ${className}`} role="img" aria-label="Zynth"><ZynthMark className="zynth-logo-mark"/><Image src="/brand/zynth-wordmark-v1.png" width={793} height={174} sizes="(max-width: 420px) 68px, (max-width: 760px) 90px, 103px" alt="" className="zynth-logo-wordmark" priority={priority}/></span>;
}
