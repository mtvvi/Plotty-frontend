import img from "figma:asset/57b3484033585072e5824b23e95837e826bb4bbd.png";

function Link() {
  return (
    <div className="h-[33.44px] relative shrink-0 w-[100.36px]" data-name="Link">
      <div className="-translate-y-1/2 absolute flex flex-col font-['Literata:Bold',sans-serif] font-bold h-[34px] justify-center leading-[0] left-0 text-[#23211e] text-[0px] top-[16px] tracking-[-1.408px] w-[100.715px]">
        <p className="leading-[33.44px] text-[35.2px]">Plotty</p>
      </div>
    </div>
  );
}

function Link1() {
  return (
    <div className="bg-[rgba(0,0,0,0.08)] content-stretch flex flex-col items-start px-[16px] py-[8px] relative rounded-[14px] shrink-0" data-name="Link">
      <div className="flex flex-col font-['Manrope:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#23211e] text-[0px] whitespace-nowrap">
        <p className="leading-[20px] text-[14px]">Каталог</p>
      </div>
    </div>
  );
}

function Link2() {
  return (
    <div className="content-stretch flex flex-col items-start px-[16px] py-[8px] relative rounded-[14px] shrink-0" data-name="Link">
      <div className="flex flex-col font-['Manrope:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#23211e] text-[14px] whitespace-nowrap">
        <p className="leading-[20px]">Мастерская</p>
      </div>
    </div>
  );
}

function Nav() {
  return (
    <div className="content-stretch flex gap-[6px] items-center relative shrink-0" data-name="Nav - Основная навигация">
      <Link1 />
      <Link2 />
    </div>
  );
}

function NavMargin() {
  return (
    <div className="content-stretch flex flex-col items-start pl-[4px] relative shrink-0" data-name="Nav - Основная навигация:margin">
      <Nav />
    </div>
  );
}

function Container2() {
  return (
    <div className="col-1 justify-self-stretch relative row-1 self-center shrink-0" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative w-full">
        <div className="flex flex-col font-['Manrope:Regular','Noto_Sans:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#6d665d] text-[16px] whitespace-nowrap">
          <p className="leading-[24px]">⌕</p>
        </div>
      </div>
    </div>
  );
}

function Container3() {
  return (
    <div className="content-stretch flex flex-col items-start overflow-clip relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Manrope:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#6d665d] text-[16px] w-full">
        <p className="leading-[normal]">Поиск по названию истории</p>
      </div>
    </div>
  );
}

function Input() {
  return (
    <div className="col-2 justify-self-stretch min-h-[42px] relative rounded-[16px] row-1 self-center shrink-0" data-name="Input - Поиск по названию истории">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start min-h-[inherit] overflow-clip py-[10px] relative rounded-[inherit] w-full">
        <Container3 />
      </div>
    </div>
  );
}

function OverlayBorder() {
  return (
    <div className="bg-[rgba(255,255,255,0.84)] h-[56px] relative rounded-[16px] shrink-0 w-full" data-name="Overlay+Border">
      <div aria-hidden="true" className="absolute border border-[rgba(35,33,30,0.08)] border-solid inset-0 pointer-events-none rounded-[16px]" />
      <div className="gap-x-[12px] gap-y-[12px] grid grid-cols-[__8.97px_minmax(0,1fr)] grid-rows-[_42px] px-[17px] py-[7px] relative size-full">
        <Container2 />
        <Input />
      </div>
    </div>
  );
}

function Container1() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative" data-name="Container">
      <div className="content-stretch flex flex-col items-start pl-[203.39px] pr-[203.41px] relative w-full">
        <OverlayBorder />
      </div>
    </div>
  );
}

function Link3() {
  return (
    <div className="bg-[rgba(255,255,255,0.82)] content-stretch flex h-[42px] items-center justify-center min-h-[42px] pb-[12.5px] pt-[11.5px] px-[13px] relative rounded-[15px] shrink-0" data-name="Link">
      <div aria-hidden="true" className="absolute border border-[rgba(41,38,34,0.12)] border-solid inset-0 pointer-events-none rounded-[15px]" />
      <div className="flex flex-col font-['Manrope:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#23211e] text-[15px] text-center tracking-[-0.15px] whitespace-nowrap">
        <p className="leading-[18px]">Войти</p>
      </div>
    </div>
  );
}

function Container() {
  return (
    <div className="min-h-[68px] relative shrink-0 w-full" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[16px] items-center min-h-[inherit] py-[6px] relative w-full">
        <Link />
        <NavMargin />
        <Container1 />
        <Link3 />
      </div>
    </div>
  );
}

function Header() {
  return (
    <div className="backdrop-blur-[12px] bg-[rgba(247,242,234,0.78)] shrink-0 sticky top-0 w-full" data-name="Header">
      <div aria-hidden="true" className="absolute border-[rgba(41,38,34,0.12)] border-b border-solid inset-0 pointer-events-none" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pb-px px-[28px] relative w-full">
        <Container />
      </div>
    </div>
  );
}

function Heading() {
  return (
    <div className="h-[21.59px] relative shrink-0 w-[76.81px]" data-name="Heading 2">
      <div className="-translate-y-1/2 absolute flex flex-col font-['Manrope:Bold',sans-serif] font-bold h-[22px] justify-center leading-[0] left-0 text-[#23211e] text-[18px] top-[10px] tracking-[-0.36px] w-[77.247px]">
        <p className="leading-[21.6px]">Фильтры</p>
      </div>
    </div>
  );
}

function Button() {
  return (
    <div className="content-stretch flex items-center justify-center min-h-[36px] px-[11px] py-[9px] relative rounded-[15px] shrink-0" data-name="Button">
      <div aria-hidden="true" className="absolute border border-[rgba(0,0,0,0)] border-solid inset-0 pointer-events-none rounded-[15px]" />
      <div className="flex flex-col font-['Manrope:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#6d665d] text-[15px] text-center tracking-[-0.15px] whitespace-nowrap">
        <p className="leading-[18px]">Очистить всё</p>
      </div>
    </div>
  );
}

function Container6() {
  return (
    <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-name="Container">
      <Heading />
      <Button />
    </div>
  );
}

function Button1() {
  return (
    <div className="bg-[#bc5f3d] min-h-[40px] opacity-60 relative rounded-[15px] shrink-0 w-full" data-name="Button">
      <div aria-hidden="true" className="absolute border border-[rgba(0,0,0,0)] border-solid inset-0 pointer-events-none rounded-[15px]" />
      <div className="flex flex-row items-center justify-center min-h-[inherit] size-full">
        <div className="content-stretch flex items-center justify-center min-h-[inherit] pb-[11.5px] pt-[10.5px] px-[13px] relative w-full">
          <div className="flex flex-col font-['Manrope:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[15px] text-center text-white tracking-[-0.15px] whitespace-nowrap">
            <p className="leading-[18px]">Применить</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Container5() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[14px] items-start relative w-full">
        <Container6 />
        <Button1 />
      </div>
    </div>
  );
}

function Container7() {
  return (
    <div className="col-1 content-stretch flex flex-col items-start justify-self-stretch relative row-1 self-start shrink-0" data-name="Container">
      <div className="flex flex-col font-['Manrope:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#6d665d] text-[13px] tracking-[0.13px] uppercase whitespace-nowrap">
        <p className="leading-[18.85px]">Фандом</p>
      </div>
    </div>
  );
}

function Container8() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start overflow-clip py-px relative rounded-[inherit] w-full">
        <div className="flex flex-col font-['Manrope:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#23211e] text-[16px] w-full">
          <p className="leading-[22px]">Любой вариант</p>
        </div>
      </div>
    </div>
  );
}

function Options() {
  return (
    <div className="bg-[rgba(255,255,255,0.84)] col-1 justify-self-stretch min-h-[52px] relative rounded-[16px] row-2 self-start shrink-0" data-name="Options - Фандом">
      <div aria-hidden="true" className="absolute border border-[rgba(41,38,34,0.12)] border-solid inset-0 pointer-events-none rounded-[16px]" />
      <div className="flex flex-col justify-center min-h-[inherit] size-full">
        <div className="content-stretch flex flex-col items-start justify-center min-h-[inherit] pl-[21px] pr-[57px] py-[14px] relative w-full">
          <Container8 />
        </div>
      </div>
    </div>
  );
}

function Label() {
  return (
    <div className="h-[82.84px] relative shrink-0 w-full" data-name="Label">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid gap-x-[12px] gap-y-[12px] grid grid-cols-[_226px] grid-rows-[__18.84px_52px] relative size-full">
        <Container7 />
        <Options />
      </div>
    </div>
  );
}

function Heading1() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col items-start min-h-px min-w-px relative" data-name="Heading 3">
      <div className="flex flex-col font-['Manrope:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#6d665d] text-[13px] tracking-[0.13px] uppercase w-full">
        <p className="leading-[18.85px]">Рейтинг</p>
      </div>
    </div>
  );
}

function Container9() {
  return (
    <div className="content-stretch flex items-center relative shrink-0 w-full" data-name="Container">
      <Heading1 />
    </div>
  );
}

function OverlayBorder2() {
  return (
    <div className="bg-[rgba(255,255,255,0.84)] content-stretch flex items-center justify-center min-h-[40px] pb-[13.5px] pt-[12.5px] px-[15px] relative rounded-[33554400px] shrink-0" data-name="Overlay+Border">
      <div aria-hidden="true" className="absolute border border-[rgba(41,38,34,0.12)] border-solid inset-0 pointer-events-none rounded-[33554400px]" />
      <div className="flex flex-col font-['Manrope:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#6d665d] text-[14px] text-center whitespace-nowrap">
        <p className="leading-[14px]">G</p>
      </div>
    </div>
  );
}

function Button2() {
  return (
    <div className="absolute content-stretch flex flex-col items-center justify-center left-0 rounded-[33554400px] top-0" data-name="Button">
      <OverlayBorder2 />
    </div>
  );
}

function OverlayBorder3() {
  return (
    <div className="bg-[rgba(255,255,255,0.84)] content-stretch flex items-center justify-center min-h-[40px] pb-[13.5px] pt-[12.5px] px-[15px] relative rounded-[33554400px] shrink-0" data-name="Overlay+Border">
      <div aria-hidden="true" className="absolute border border-[rgba(41,38,34,0.12)] border-solid inset-0 pointer-events-none rounded-[33554400px]" />
      <div className="flex flex-col font-['Manrope:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#6d665d] text-[14px] text-center whitespace-nowrap">
        <p className="leading-[14px]">NC-17</p>
      </div>
    </div>
  );
}

function Button3() {
  return (
    <div className="absolute content-stretch flex flex-col items-center justify-center left-[48.13px] rounded-[33554400px] top-0" data-name="Button">
      <OverlayBorder3 />
    </div>
  );
}

function OverlayBorder4() {
  return (
    <div className="bg-[rgba(255,255,255,0.84)] content-stretch flex items-center justify-center min-h-[40px] pb-[13.5px] pt-[12.5px] px-[15px] relative rounded-[33554400px] shrink-0" data-name="Overlay+Border">
      <div aria-hidden="true" className="absolute border border-[rgba(41,38,34,0.12)] border-solid inset-0 pointer-events-none rounded-[33554400px]" />
      <div className="flex flex-col font-['Manrope:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#6d665d] text-[14px] text-center whitespace-nowrap">
        <p className="leading-[14px]">NC-21</p>
      </div>
    </div>
  );
}

function Button4() {
  return (
    <div className="absolute content-stretch flex flex-col items-center justify-center left-[125.36px] rounded-[33554400px] top-0" data-name="Button">
      <OverlayBorder4 />
    </div>
  );
}

function OverlayBorder5() {
  return (
    <div className="bg-[rgba(255,255,255,0.84)] content-stretch flex items-center justify-center min-h-[40px] pb-[13.5px] pt-[12.5px] px-[15px] relative rounded-[33554400px] shrink-0" data-name="Overlay+Border">
      <div aria-hidden="true" className="absolute border border-[rgba(41,38,34,0.12)] border-solid inset-0 pointer-events-none rounded-[33554400px]" />
      <div className="flex flex-col font-['Manrope:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#6d665d] text-[14px] text-center whitespace-nowrap">
        <p className="leading-[14px]">PG-13</p>
      </div>
    </div>
  );
}

function Button5() {
  return (
    <div className="absolute content-stretch flex flex-col items-center justify-center left-0 rounded-[33554400px] top-[48px]" data-name="Button">
      <OverlayBorder5 />
    </div>
  );
}

function OverlayBorder6() {
  return (
    <div className="bg-[rgba(255,255,255,0.84)] content-stretch flex items-center justify-center min-h-[40px] pb-[13.5px] pt-[12.5px] px-[15px] relative rounded-[33554400px] shrink-0" data-name="Overlay+Border">
      <div aria-hidden="true" className="absolute border border-[rgba(41,38,34,0.12)] border-solid inset-0 pointer-events-none rounded-[33554400px]" />
      <div className="flex flex-col font-['Manrope:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#6d665d] text-[14px] text-center whitespace-nowrap">
        <p className="leading-[14px]">R</p>
      </div>
    </div>
  );
}

function Button6() {
  return (
    <div className="absolute content-stretch flex flex-col items-center justify-center left-[76.7px] rounded-[33554400px] top-[48px]" data-name="Button">
      <OverlayBorder6 />
    </div>
  );
}

function Container10() {
  return (
    <div className="h-[88px] relative shrink-0 w-full" data-name="Container">
      <Button2 />
      <Button3 />
      <Button4 />
      <Button5 />
      <Button6 />
    </div>
  );
}

function Section1() {
  return (
    <div className="relative shrink-0 w-full" data-name="Section">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[12.01px] items-start relative w-full">
        <Container9 />
        <Container10 />
      </div>
    </div>
  );
}

function Heading2() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col items-start min-h-px min-w-px relative" data-name="Heading 3">
      <div className="flex flex-col font-['Manrope:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#6d665d] text-[13px] tracking-[0.13px] uppercase w-full">
        <p className="leading-[18.85px]">Статус</p>
      </div>
    </div>
  );
}

function Container11() {
  return (
    <div className="content-stretch flex items-center relative shrink-0 w-full" data-name="Container">
      <Heading2 />
    </div>
  );
}

function OverlayBorder7() {
  return (
    <div className="bg-[rgba(255,255,255,0.84)] content-stretch flex items-center justify-center min-h-[40px] pb-[13.5px] pt-[12.5px] px-[15px] relative rounded-[33554400px] shrink-0" data-name="Overlay+Border">
      <div aria-hidden="true" className="absolute border border-[rgba(41,38,34,0.12)] border-solid inset-0 pointer-events-none rounded-[33554400px]" />
      <div className="flex flex-col font-['Manrope:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#6d665d] text-[14px] text-center whitespace-nowrap">
        <p className="leading-[14px]">В процессе</p>
      </div>
    </div>
  );
}

function Button7() {
  return (
    <div className="absolute content-stretch flex flex-col items-center justify-center left-0 rounded-[33554400px] top-0" data-name="Button">
      <OverlayBorder7 />
    </div>
  );
}

function OverlayBorder8() {
  return (
    <div className="bg-[rgba(255,255,255,0.84)] content-stretch flex items-center justify-center min-h-[40px] pb-[13.5px] pt-[12.5px] px-[15px] relative rounded-[33554400px] shrink-0" data-name="Overlay+Border">
      <div aria-hidden="true" className="absolute border border-[rgba(41,38,34,0.12)] border-solid inset-0 pointer-events-none rounded-[33554400px]" />
      <div className="flex flex-col font-['Manrope:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#6d665d] text-[14px] text-center whitespace-nowrap">
        <p className="leading-[14px]">Завершён</p>
      </div>
    </div>
  );
}

function Button8() {
  return (
    <div className="absolute content-stretch flex flex-col items-center justify-center left-[116.31px] rounded-[33554400px] top-0" data-name="Button">
      <OverlayBorder8 />
    </div>
  );
}

function OverlayBorder9() {
  return (
    <div className="bg-[rgba(255,255,255,0.84)] content-stretch flex items-center justify-center min-h-[40px] pb-[13.5px] pt-[12.5px] px-[15px] relative rounded-[33554400px] shrink-0" data-name="Overlay+Border">
      <div aria-hidden="true" className="absolute border border-[rgba(41,38,34,0.12)] border-solid inset-0 pointer-events-none rounded-[33554400px]" />
      <div className="flex flex-col font-['Manrope:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#6d665d] text-[14px] text-center whitespace-nowrap">
        <p className="leading-[14px]">Заморожен</p>
      </div>
    </div>
  );
}

function Button9() {
  return (
    <div className="absolute content-stretch flex flex-col items-center justify-center left-0 rounded-[33554400px] top-[48px]" data-name="Button">
      <OverlayBorder9 />
    </div>
  );
}

function Container12() {
  return (
    <div className="h-[88px] relative shrink-0 w-full" data-name="Container">
      <Button7 />
      <Button8 />
      <Button9 />
    </div>
  );
}

function Section2() {
  return (
    <div className="relative shrink-0 w-full" data-name="Section">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[12px] items-start relative w-full">
        <Container11 />
        <Container12 />
      </div>
    </div>
  );
}

function Heading3() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col items-start min-h-px min-w-px relative" data-name="Heading 3">
      <div className="flex flex-col font-['Manrope:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#6d665d] text-[13px] tracking-[0.13px] uppercase w-full">
        <p className="leading-[18.85px]">Размер</p>
      </div>
    </div>
  );
}

function Container13() {
  return (
    <div className="content-stretch flex items-center relative shrink-0 w-full" data-name="Container">
      <Heading3 />
    </div>
  );
}

function OverlayBorder10() {
  return (
    <div className="bg-[rgba(255,255,255,0.84)] content-stretch flex items-center justify-center min-h-[40px] pb-[13.5px] pt-[12.5px] px-[15px] relative rounded-[33554400px] shrink-0" data-name="Overlay+Border">
      <div aria-hidden="true" className="absolute border border-[rgba(41,38,34,0.12)] border-solid inset-0 pointer-events-none rounded-[33554400px]" />
      <div className="flex flex-col font-['Manrope:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#6d665d] text-[14px] text-center whitespace-nowrap">
        <p className="leading-[14px]">Драббл</p>
      </div>
    </div>
  );
}

function Button10() {
  return (
    <div className="absolute content-stretch flex flex-col items-center justify-center left-0 rounded-[33554400px] top-0" data-name="Button">
      <OverlayBorder10 />
    </div>
  );
}

function OverlayBorder11() {
  return (
    <div className="bg-[rgba(255,255,255,0.84)] content-stretch flex items-center justify-center min-h-[40px] pb-[13.5px] pt-[12.5px] px-[15px] relative rounded-[33554400px] shrink-0" data-name="Overlay+Border">
      <div aria-hidden="true" className="absolute border border-[rgba(41,38,34,0.12)] border-solid inset-0 pointer-events-none rounded-[33554400px]" />
      <div className="flex flex-col font-['Manrope:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#6d665d] text-[14px] text-center whitespace-nowrap">
        <p className="leading-[14px]">Макси</p>
      </div>
    </div>
  );
}

function Button11() {
  return (
    <div className="absolute content-stretch flex flex-col items-center justify-center left-[89.91px] rounded-[33554400px] top-0" data-name="Button">
      <OverlayBorder11 />
    </div>
  );
}

function OverlayBorder12() {
  return (
    <div className="bg-[rgba(255,255,255,0.84)] content-stretch flex items-center justify-center min-h-[40px] pb-[13.5px] pt-[12.5px] px-[15px] relative rounded-[33554400px] shrink-0" data-name="Overlay+Border">
      <div aria-hidden="true" className="absolute border border-[rgba(41,38,34,0.12)] border-solid inset-0 pointer-events-none rounded-[33554400px]" />
      <div className="flex flex-col font-['Manrope:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#6d665d] text-[14px] text-center whitespace-nowrap">
        <p className="leading-[14px]">Миди</p>
      </div>
    </div>
  );
}

function Button12() {
  return (
    <div className="absolute content-stretch flex flex-col items-center justify-center left-0 rounded-[33554400px] top-[48px]" data-name="Button">
      <OverlayBorder12 />
    </div>
  );
}

function OverlayBorder13() {
  return (
    <div className="bg-[rgba(255,255,255,0.84)] content-stretch flex items-center justify-center min-h-[40px] pb-[13.5px] pt-[12.5px] px-[15px] relative rounded-[33554400px] shrink-0" data-name="Overlay+Border">
      <div aria-hidden="true" className="absolute border border-[rgba(41,38,34,0.12)] border-solid inset-0 pointer-events-none rounded-[33554400px]" />
      <div className="flex flex-col font-['Manrope:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#6d665d] text-[14px] text-center whitespace-nowrap">
        <p className="leading-[14px]">Мини</p>
      </div>
    </div>
  );
}

function Button13() {
  return (
    <div className="absolute content-stretch flex flex-col items-center justify-center left-[75.28px] rounded-[33554400px] top-[48px]" data-name="Button">
      <OverlayBorder13 />
    </div>
  );
}

function Container14() {
  return (
    <div className="h-[88px] relative shrink-0 w-full" data-name="Container">
      <Button10 />
      <Button11 />
      <Button12 />
      <Button13 />
    </div>
  );
}

function Section3() {
  return (
    <div className="relative shrink-0 w-full" data-name="Section">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[12.01px] items-start relative w-full">
        <Container13 />
        <Container14 />
      </div>
    </div>
  );
}

function Heading4() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col items-start min-h-px min-w-px relative" data-name="Heading 3">
      <div className="flex flex-col font-['Manrope:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#6d665d] text-[13px] tracking-[0.13px] uppercase w-full">
        <p className="leading-[18.85px]">Жанры</p>
      </div>
    </div>
  );
}

function Container15() {
  return (
    <div className="content-stretch flex items-center relative shrink-0 w-full" data-name="Container">
      <Heading4 />
    </div>
  );
}

function OverlayBorder14() {
  return (
    <div className="bg-[rgba(255,255,255,0.84)] content-stretch flex items-center justify-center min-h-[40px] pb-[13.5px] pt-[12.5px] px-[15px] relative rounded-[33554400px] shrink-0" data-name="Overlay+Border">
      <div aria-hidden="true" className="absolute border border-[rgba(41,38,34,0.12)] border-solid inset-0 pointer-events-none rounded-[33554400px]" />
      <div className="flex flex-col font-['Manrope:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#6d665d] text-[14px] text-center whitespace-nowrap">
        <p className="leading-[14px]">Драма</p>
      </div>
    </div>
  );
}

function Button14() {
  return (
    <div className="absolute content-stretch flex flex-col items-center justify-center left-0 rounded-[33554400px] top-0" data-name="Button">
      <OverlayBorder14 />
    </div>
  );
}

function OverlayBorder15() {
  return (
    <div className="bg-[rgba(255,255,255,0.84)] content-stretch flex items-center justify-center min-h-[40px] pb-[13.5px] pt-[12.5px] px-[15px] relative rounded-[33554400px] shrink-0" data-name="Overlay+Border">
      <div aria-hidden="true" className="absolute border border-[rgba(41,38,34,0.12)] border-solid inset-0 pointer-events-none rounded-[33554400px]" />
      <div className="flex flex-col font-['Manrope:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#6d665d] text-[14px] text-center whitespace-nowrap">
        <p className="leading-[14px]">Мистика</p>
      </div>
    </div>
  );
}

function Button15() {
  return (
    <div className="absolute content-stretch flex flex-col items-center justify-center left-[82.92px] rounded-[33554400px] top-0" data-name="Button">
      <OverlayBorder15 />
    </div>
  );
}

function OverlayBorder16() {
  return (
    <div className="bg-[rgba(255,255,255,0.84)] content-stretch flex items-center justify-center min-h-[40px] pb-[13.5px] pt-[12.5px] px-[15px] relative rounded-[33554400px] shrink-0" data-name="Overlay+Border">
      <div aria-hidden="true" className="absolute border border-[rgba(41,38,34,0.12)] border-solid inset-0 pointer-events-none rounded-[33554400px]" />
      <div className="flex flex-col font-['Manrope:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#6d665d] text-[14px] text-center whitespace-nowrap">
        <p className="leading-[14px]">Повседневность</p>
      </div>
    </div>
  );
}

function Button16() {
  return (
    <div className="absolute content-stretch flex flex-col items-center justify-center left-0 rounded-[33554400px] top-[48px]" data-name="Button">
      <OverlayBorder16 />
    </div>
  );
}

function OverlayBorder17() {
  return (
    <div className="bg-[rgba(255,255,255,0.84)] content-stretch flex items-center justify-center min-h-[40px] pb-[13.5px] pt-[12.5px] px-[15px] relative rounded-[33554400px] shrink-0" data-name="Overlay+Border">
      <div aria-hidden="true" className="absolute border border-[rgba(41,38,34,0.12)] border-solid inset-0 pointer-events-none rounded-[33554400px]" />
      <div className="flex flex-col font-['Manrope:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#6d665d] text-[14px] text-center whitespace-nowrap">
        <p className="leading-[14px]">Приключения</p>
      </div>
    </div>
  );
}

function Button17() {
  return (
    <div className="absolute content-stretch flex flex-col items-center justify-center left-0 rounded-[33554400px] top-[96px]" data-name="Button">
      <OverlayBorder17 />
    </div>
  );
}

function OverlayBorder18() {
  return (
    <div className="bg-[rgba(255,255,255,0.84)] content-stretch flex items-center justify-center min-h-[40px] pb-[13.5px] pt-[12.5px] px-[15px] relative rounded-[33554400px] shrink-0" data-name="Overlay+Border">
      <div aria-hidden="true" className="absolute border border-[rgba(41,38,34,0.12)] border-solid inset-0 pointer-events-none rounded-[33554400px]" />
      <div className="flex flex-col font-['Manrope:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#6d665d] text-[14px] text-center whitespace-nowrap">
        <p className="leading-[14px]">Фэнтези</p>
      </div>
    </div>
  );
}

function Button18() {
  return (
    <div className="absolute content-stretch flex flex-col items-center justify-center left-[133.17px] rounded-[33554400px] top-[96px]" data-name="Button">
      <OverlayBorder18 />
    </div>
  );
}

function OverlayBorder19() {
  return (
    <div className="bg-[rgba(255,255,255,0.84)] content-stretch flex items-center justify-center min-h-[40px] pb-[13.5px] pt-[12.5px] px-[15px] relative rounded-[33554400px] shrink-0" data-name="Overlay+Border">
      <div aria-hidden="true" className="absolute border border-[rgba(41,38,34,0.12)] border-solid inset-0 pointer-events-none rounded-[33554400px]" />
      <div className="flex flex-col font-['Manrope:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#6d665d] text-[14px] text-center whitespace-nowrap">
        <p className="leading-[14px]">Юмор</p>
      </div>
    </div>
  );
}

function Button19() {
  return (
    <div className="absolute content-stretch flex flex-col items-center justify-center left-0 rounded-[33554400px] top-[144px]" data-name="Button">
      <OverlayBorder19 />
    </div>
  );
}

function Container16() {
  return (
    <div className="h-[184px] relative shrink-0 w-full" data-name="Container">
      <Button14 />
      <Button15 />
      <Button16 />
      <Button17 />
      <Button18 />
      <Button19 />
    </div>
  );
}

function Section4() {
  return (
    <div className="relative shrink-0 w-full" data-name="Section">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[12px] items-start relative w-full">
        <Container15 />
        <Container16 />
      </div>
    </div>
  );
}

function Heading5() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col items-start min-h-px min-w-px relative" data-name="Heading 3">
      <div className="flex flex-col font-['Manrope:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#6d665d] text-[13px] tracking-[0.13px] uppercase w-full">
        <p className="leading-[18.85px]">Предупреждения</p>
      </div>
    </div>
  );
}

function Container17() {
  return (
    <div className="content-stretch flex items-center relative shrink-0 w-full" data-name="Container">
      <Heading5 />
    </div>
  );
}

function OverlayBorder20() {
  return (
    <div className="bg-[rgba(255,255,255,0.84)] content-stretch flex items-center justify-center min-h-[40px] pb-[13.5px] pt-[12.5px] px-[15px] relative rounded-[33554400px] shrink-0" data-name="Overlay+Border">
      <div aria-hidden="true" className="absolute border border-[rgba(41,38,34,0.12)] border-solid inset-0 pointer-events-none rounded-[33554400px]" />
      <div className="flex flex-col font-['Manrope:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#6d665d] text-[14px] text-center whitespace-nowrap">
        <p className="leading-[14px]">OOC</p>
      </div>
    </div>
  );
}

function Button20() {
  return (
    <div className="absolute content-stretch flex flex-col items-center justify-center left-0 rounded-[33554400px] top-0" data-name="Button">
      <OverlayBorder20 />
    </div>
  );
}

function OverlayBorder21() {
  return (
    <div className="bg-[rgba(255,255,255,0.84)] content-stretch flex items-center justify-center min-h-[40px] pb-[13.5px] pt-[12.5px] px-[15px] relative rounded-[33554400px] shrink-0" data-name="Overlay+Border">
      <div aria-hidden="true" className="absolute border border-[rgba(41,38,34,0.12)] border-solid inset-0 pointer-events-none rounded-[33554400px]" />
      <div className="flex flex-col font-['Manrope:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#6d665d] text-[14px] text-center whitespace-nowrap">
        <p className="leading-[14px]">Насилие</p>
      </div>
    </div>
  );
}

function Button21() {
  return (
    <div className="absolute content-stretch flex flex-col items-center justify-center left-[68.97px] rounded-[33554400px] top-0" data-name="Button">
      <OverlayBorder21 />
    </div>
  );
}

function OverlayBorder22() {
  return (
    <div className="bg-[rgba(255,255,255,0.84)] content-stretch flex items-center justify-center min-h-[40px] pb-[13.5px] pt-[12.5px] px-[15px] relative rounded-[33554400px] shrink-0" data-name="Overlay+Border">
      <div aria-hidden="true" className="absolute border border-[rgba(41,38,34,0.12)] border-solid inset-0 pointer-events-none rounded-[33554400px]" />
      <div className="flex flex-col font-['Manrope:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#6d665d] text-[14px] text-center whitespace-nowrap">
        <p className="leading-[14px]">Нецензурная лексика</p>
      </div>
    </div>
  );
}

function Button22() {
  return (
    <div className="absolute content-stretch flex flex-col items-center justify-center left-0 rounded-[33554400px] top-[48px]" data-name="Button">
      <OverlayBorder22 />
    </div>
  );
}

function OverlayBorder23() {
  return (
    <div className="bg-[rgba(255,255,255,0.84)] content-stretch flex items-center justify-center min-h-[40px] pb-[13.5px] pt-[12.5px] px-[15px] relative rounded-[33554400px] shrink-0" data-name="Overlay+Border">
      <div aria-hidden="true" className="absolute border border-[rgba(41,38,34,0.12)] border-solid inset-0 pointer-events-none rounded-[33554400px]" />
      <div className="flex flex-col font-['Manrope:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#6d665d] text-[14px] text-center whitespace-nowrap">
        <p className="leading-[14px]">Смерть персонажа</p>
      </div>
    </div>
  );
}

function Button23() {
  return (
    <div className="absolute content-stretch flex flex-col items-center justify-center left-0 rounded-[33554400px] top-[96px]" data-name="Button">
      <OverlayBorder23 />
    </div>
  );
}

function Container18() {
  return (
    <div className="h-[136px] relative shrink-0 w-full" data-name="Container">
      <Button20 />
      <Button21 />
      <Button22 />
      <Button23 />
    </div>
  );
}

function Section5() {
  return (
    <div className="relative shrink-0 w-full" data-name="Section">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[12px] items-start relative w-full">
        <Container17 />
        <Container18 />
      </div>
    </div>
  );
}

function OverlayBorder1() {
  return (
    <div className="bg-[rgba(240,232,219,0.7)] relative rounded-[24px] shrink-0 w-full" data-name="Overlay+Border">
      <div aria-hidden="true" className="absolute border border-[rgba(41,38,34,0.12)] border-solid inset-0 pointer-events-none rounded-[24px]" />
      <div className="content-stretch flex flex-col gap-[24px] items-start p-[23px] relative w-full">
        <Container5 />
        <Label />
        <Section1 />
        <Section2 />
        <Section3 />
        <Section4 />
        <Section5 />
      </div>
    </div>
  );
}

function Aside() {
  return (
    <div className="col-1 content-stretch flex flex-col items-start justify-self-stretch relative row-1 self-start shrink-0" data-name="Aside">
      <OverlayBorder1 />
    </div>
  );
}

function OverlayShadow() {
  return (
    <div className="bg-[rgba(255,255,255,0.9)] content-stretch flex flex-col items-start px-[12px] py-[8px] relative rounded-[33554400px] shadow-[0px_6px_16px_0px_rgba(46,35,23,0.06)] shrink-0" data-name="Overlay+Shadow">
      <div className="flex flex-col font-['Manrope:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#23211e] text-[14px] whitespace-nowrap">
        <p className="leading-[20px]">Найдено 2</p>
      </div>
    </div>
  );
}

function Container20() {
  return (
    <div className="content-center flex flex-wrap items-center relative shrink-0 w-full" data-name="Container">
      <OverlayShadow />
    </div>
  );
}

function Heading6() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Heading 2">
      <div className="flex flex-col font-['Manrope:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#23211e] text-[17.6px] tracking-[-0.352px] whitespace-nowrap">
        <p className="leading-[22px]">Капитан Марвел</p>
      </div>
    </div>
  );
}

function Container27() {
  return (
    <div className="relative self-stretch shrink-0 w-[18.03px]" data-name="Container">
      <div className="-translate-y-1/2 absolute flex flex-col font-['Manrope:Regular',sans-serif] font-normal h-[20px] justify-center leading-[0] left-0 text-[#6d665d] text-[13px] top-[9px] w-[18.336px]">
        <p className="leading-[19.5px]">DC</p>
      </div>
    </div>
  );
}

function Container28() {
  return (
    <div className="relative self-stretch shrink-0 w-[35.27px]" data-name="Container">
      <div className="-translate-y-1/2 absolute flex flex-col font-['Manrope:Regular',sans-serif] font-normal h-[20px] justify-center leading-[0] left-0 text-[#6d665d] text-[13px] top-[9px] w-[35.577px]">
        <p className="leading-[19.5px]">NC-17</p>
      </div>
    </div>
  );
}

function Container29() {
  return (
    <div className="relative self-stretch shrink-0 w-[70.78px]" data-name="Container">
      <div className="-translate-y-1/2 absolute flex flex-col font-['Manrope:Regular',sans-serif] font-normal h-[20px] justify-center leading-[0] left-0 text-[#6d665d] text-[13px] top-[9px] w-[71.089px]">
        <p className="leading-[19.5px]">В процессе</p>
      </div>
    </div>
  );
}

function Container26() {
  return (
    <div className="content-stretch flex flex-wrap gap-[0px_10px] h-[19.5px] items-start relative shrink-0 w-full" data-name="Container">
      <Container27 />
      <Container28 />
      <Container29 />
    </div>
  );
}

function Container25() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-[144.08px]" data-name="Container">
      <Heading6 />
      <Container26 />
    </div>
  );
}

function Overlay() {
  return (
    <div className="bg-[rgba(54,81,63,0.08)] content-stretch flex flex-col items-start px-[12px] py-[8px] relative rounded-[14px] shrink-0" data-name="Overlay">
      <div className="flex flex-col font-['Manrope:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#36513f] text-[13px] whitespace-nowrap">
        <p className="leading-[19.5px]">1 глав</p>
      </div>
    </div>
  );
}

function Container24() {
  return (
    <div className="content-start flex flex-wrap items-start justify-between relative shrink-0 w-full" data-name="Container">
      <Container25 />
      <Overlay />
    </div>
  );
}

function BackgroundBorder() {
  return (
    <div className="bg-[#f0e8db] min-h-[40px] relative rounded-[33554400px] self-stretch shrink-0" data-name="Background+Border">
      <div aria-hidden="true" className="absolute border border-[rgba(41,38,34,0.12)] border-solid inset-0 pointer-events-none rounded-[33554400px]" />
      <div className="flex flex-row items-center justify-center min-h-[inherit] size-full">
        <div className="content-stretch flex h-full items-center justify-center min-h-[inherit] pb-[13.5px] pt-[12.5px] px-[15px] relative">
          <div className="flex flex-col font-['Manrope:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#23211e] text-[14px] text-center whitespace-nowrap">
            <p className="leading-[14px]">В процессе</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function BackgroundBorder1() {
  return (
    <div className="bg-[#f0e8db] min-h-[40px] relative rounded-[33554400px] self-stretch shrink-0" data-name="Background+Border">
      <div aria-hidden="true" className="absolute border border-[rgba(41,38,34,0.12)] border-solid inset-0 pointer-events-none rounded-[33554400px]" />
      <div className="flex flex-row items-center justify-center min-h-[inherit] size-full">
        <div className="content-stretch flex h-full items-center justify-center min-h-[inherit] pb-[13.5px] pt-[12.5px] px-[15px] relative">
          <div className="flex flex-col font-['Manrope:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#23211e] text-[14px] text-center whitespace-nowrap">
            <p className="leading-[14px]">DC</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function BackgroundBorder2() {
  return (
    <div className="bg-[#f0e8db] min-h-[40px] relative rounded-[33554400px] self-stretch shrink-0" data-name="Background+Border">
      <div aria-hidden="true" className="absolute border border-[rgba(41,38,34,0.12)] border-solid inset-0 pointer-events-none rounded-[33554400px]" />
      <div className="flex flex-row items-center justify-center min-h-[inherit] size-full">
        <div className="content-stretch flex h-full items-center justify-center min-h-[inherit] pb-[13.5px] pt-[12.5px] px-[15px] relative">
          <div className="flex flex-col font-['Manrope:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#23211e] text-[14px] text-center whitespace-nowrap">
            <p className="leading-[14px]">Драма</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function BackgroundBorder3() {
  return (
    <div className="bg-[#f0e8db] min-h-[40px] relative rounded-[33554400px] self-stretch shrink-0" data-name="Background+Border">
      <div aria-hidden="true" className="absolute border border-[rgba(41,38,34,0.12)] border-solid inset-0 pointer-events-none rounded-[33554400px]" />
      <div className="flex flex-row items-center justify-center min-h-[inherit] size-full">
        <div className="content-stretch flex h-full items-center justify-center min-h-[inherit] pb-[13.5px] pt-[12.5px] px-[15px] relative">
          <div className="flex flex-col font-['Manrope:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#23211e] text-[14px] text-center whitespace-nowrap">
            <p className="leading-[14px]">NC-17</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function BackgroundBorder4() {
  return (
    <div className="bg-[#f0e8db] min-h-[40px] relative rounded-[33554400px] self-stretch shrink-0" data-name="Background+Border">
      <div aria-hidden="true" className="absolute border border-[rgba(41,38,34,0.12)] border-solid inset-0 pointer-events-none rounded-[33554400px]" />
      <div className="flex flex-row items-center justify-center min-h-[inherit] size-full">
        <div className="content-stretch flex h-full items-center justify-center min-h-[inherit] pb-[13.5px] pt-[12.5px] px-[15px] relative">
          <div className="flex flex-col font-['Manrope:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#23211e] text-[14px] text-center whitespace-nowrap">
            <p className="leading-[14px]">Макси</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Container30() {
  return (
    <div className="content-stretch flex flex-wrap gap-[0px_8px] h-[40px] items-start relative shrink-0 w-full" data-name="Container">
      <BackgroundBorder />
      <BackgroundBorder1 />
      <BackgroundBorder2 />
      <BackgroundBorder3 />
      <BackgroundBorder4 />
    </div>
  );
}

function Background1() {
  return (
    <div className="bg-[#f7f2ea] relative rounded-[12px] self-stretch shrink-0" data-name="Background">
      <div className="content-stretch flex flex-col h-full items-start pb-[8.5px] pt-[7px] px-[11px] relative">
        <div className="flex flex-col font-['Manrope:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#23211e] text-[13px] whitespace-nowrap">
          <p className="leading-[19.5px]">Создана 31.03.2026</p>
        </div>
      </div>
    </div>
  );
}

function Background2() {
  return (
    <div className="bg-[#f7f2ea] relative rounded-[12px] self-stretch shrink-0" data-name="Background">
      <div className="content-stretch flex flex-col h-full items-start pb-[8.5px] pt-[7px] px-[11px] relative">
        <div className="flex flex-col font-['Manrope:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#23211e] text-[13px] whitespace-nowrap">
          <p className="leading-[19.5px]">Обновлена 31.03.2026</p>
        </div>
      </div>
    </div>
  );
}

function Container32() {
  return (
    <div className="content-stretch flex flex-wrap gap-[0px_10px] h-[35.5px] items-start relative shrink-0" data-name="Container">
      <Background1 />
      <Background2 />
    </div>
  );
}

function BackgroundBorderShadow() {
  return (
    <div className="bg-[#bc5f3d] content-stretch flex items-center justify-center min-h-[40px] pb-[11.5px] pt-[10.5px] px-[15px] relative rounded-[15px] shrink-0" data-name="Background+Border+Shadow">
      <div aria-hidden="true" className="absolute border border-[rgba(0,0,0,0)] border-solid inset-0 pointer-events-none rounded-[15px] shadow-[0px_10px_24px_0px_rgba(188,95,61,0.18)]" />
      <div className="flex flex-col font-['Manrope:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[15px] text-center text-white tracking-[-0.15px] whitespace-nowrap">
        <p className="leading-[18px]">Открыть историю</p>
      </div>
    </div>
  );
}

function Container31() {
  return (
    <div className="content-end flex flex-wrap items-end justify-between pt-[4px] relative shrink-0 w-full" data-name="Container">
      <Container32 />
      <BackgroundBorderShadow />
    </div>
  );
}

function Container23() {
  return (
    <div className="col-2 justify-self-stretch relative row-1 self-start shrink-0" data-name="Container">
      <div className="content-stretch flex flex-col gap-[16px] items-start p-[20px] relative w-full">
        <Container24 />
        <Container30 />
        <Container31 />
      </div>
    </div>
  );
}

function Container35() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Manrope:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#6d665d] text-[13px] tracking-[0.13px] uppercase whitespace-nowrap">
        <p className="leading-[18.85px]">Plotty story</p>
      </div>
    </div>
  );
}

function Container36() {
  return (
    <div className="content-stretch flex flex-col items-start max-w-[224px] pb-[0.59px] relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Manrope:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#23211e] text-[18px] tracking-[-0.36px] whitespace-nowrap">
        <p className="leading-[21.6px]">Капитан Марвел</p>
      </div>
    </div>
  );
}

function Container37() {
  return (
    <div className="content-stretch flex flex-col items-start max-w-[224px] relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Manrope:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#6d665d] text-[13px] tracking-[0.13px] whitespace-nowrap">
        <p className="leading-[18.85px] mb-0">Обложка появится</p>
        <p className="leading-[18.85px] mb-0">автоматически, когда у</p>
        <p className="leading-[18.85px] mb-0">первой главы будет</p>
        <p className="leading-[18.85px]">иллюстрация.</p>
      </div>
    </div>
  );
}

function Container34() {
  return (
    <div className="content-stretch flex flex-col gap-[7px] items-start min-w-[187px] relative shrink-0 w-[187px]" data-name="Container">
      <Container35 />
      <Container36 />
      <Container37 />
    </div>
  );
}

function Container33() {
  return (
    <div className="aspect-[219/205.47999572753906] relative shrink-0" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-end pb-[16px] pt-[57.67px] px-[16px] relative w-full">
        <Container34 />
      </div>
    </div>
  );
}

function BackgroundVerticalBorder() {
  return (
    <div className="col-1 justify-self-stretch relative row-1 self-start shrink-0" data-name="Background+VerticalBorder" style={{ backgroundImage: "linear-gradient(135.161deg, rgb(240, 232, 219) 0%, rgb(247, 242, 234) 100%)" }}>
      <div className="content-stretch flex flex-col items-start justify-center overflow-clip pr-px relative rounded-[inherit] w-full">
        <Container33 />
      </div>
      <div aria-hidden="true" className="absolute border-[rgba(35,33,30,0.08)] border-r border-solid inset-0 pointer-events-none" />
    </div>
  );
}

function Container22() {
  return (
    <div className="h-[205.48px] relative shrink-0 w-full" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid grid grid-cols-[__220px_minmax(0,1fr)] grid-rows-[_205.48px] relative size-full">
        <Container23 />
        <BackgroundVerticalBorder />
      </div>
    </div>
  );
}

function Link4() {
  return (
    <div className="bg-[rgba(255,255,255,0.84)] relative rounded-[24px] shrink-0 w-full" data-name="Link">
      <div className="content-stretch flex flex-col items-start overflow-clip p-px relative rounded-[inherit] w-full">
        <Container22 />
      </div>
      <div aria-hidden="true" className="absolute border border-[rgba(35,33,30,0.08)] border-solid inset-0 pointer-events-none rounded-[24px]" />
    </div>
  );
}

function Heading7() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Heading 2">
      <div className="flex flex-col font-['Manrope:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#23211e] text-[17.6px] tracking-[-0.352px] whitespace-nowrap">
        <p className="leading-[22px]">Первая</p>
      </div>
    </div>
  );
}

function Container43() {
  return (
    <div className="relative self-stretch shrink-0 w-[52.97px]" data-name="Container">
      <div className="-translate-y-1/2 absolute flex flex-col font-['Manrope:Regular',sans-serif] font-normal h-[20px] justify-center leading-[0] left-0 text-[#6d665d] text-[13px] top-[9px] w-[53.332px]">
        <p className="leading-[19.5px]">Ведьмак</p>
      </div>
    </div>
  );
}

function Container44() {
  return (
    <div className="relative self-stretch shrink-0 w-[36.14px]" data-name="Container">
      <div className="-translate-y-1/2 absolute flex flex-col font-['Manrope:Regular',sans-serif] font-normal h-[20px] justify-center leading-[0] left-0 text-[#6d665d] text-[13px] top-[9px] w-[36.45px]">
        <p className="leading-[19.5px]">NC-21</p>
      </div>
    </div>
  );
}

function Container45() {
  return (
    <div className="relative self-stretch shrink-0 w-[70.78px]" data-name="Container">
      <div className="-translate-y-1/2 absolute flex flex-col font-['Manrope:Regular',sans-serif] font-normal h-[20px] justify-center leading-[0] left-0 text-[#6d665d] text-[13px] top-[9px] w-[71.089px]">
        <p className="leading-[19.5px]">В процессе</p>
      </div>
    </div>
  );
}

function Container42() {
  return (
    <div className="content-stretch flex flex-wrap gap-[0px_10px] h-[19.5px] items-start relative shrink-0 w-full" data-name="Container">
      <Container43 />
      <Container44 />
      <Container45 />
    </div>
  );
}

function Container41() {
  return (
    <div className="content-stretch flex flex-col gap-[8.01px] items-start relative shrink-0 w-[179.89px]" data-name="Container">
      <Heading7 />
      <Container42 />
    </div>
  );
}

function Overlay1() {
  return (
    <div className="bg-[rgba(54,81,63,0.08)] content-stretch flex flex-col items-start px-[12px] py-[8px] relative rounded-[14px] shrink-0" data-name="Overlay">
      <div className="flex flex-col font-['Manrope:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#36513f] text-[13px] whitespace-nowrap">
        <p className="leading-[19.5px]">3 глав</p>
      </div>
    </div>
  );
}

function Container40() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="content-start flex flex-wrap items-start justify-between relative w-full">
        <Container41 />
        <Overlay1 />
      </div>
    </div>
  );
}

function BackgroundBorder5() {
  return (
    <div className="bg-[#f0e8db] min-h-[40px] relative rounded-[33554400px] self-stretch shrink-0" data-name="Background+Border">
      <div aria-hidden="true" className="absolute border border-[rgba(41,38,34,0.12)] border-solid inset-0 pointer-events-none rounded-[33554400px]" />
      <div className="flex flex-row items-center justify-center min-h-[inherit] size-full">
        <div className="content-stretch flex h-full items-center justify-center min-h-[inherit] pb-[13.5px] pt-[12.5px] px-[15px] relative">
          <div className="flex flex-col font-['Manrope:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#23211e] text-[14px] text-center whitespace-nowrap">
            <p className="leading-[14px]">В процессе</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function BackgroundBorder6() {
  return (
    <div className="bg-[#f0e8db] min-h-[40px] relative rounded-[33554400px] self-stretch shrink-0" data-name="Background+Border">
      <div aria-hidden="true" className="absolute border border-[rgba(41,38,34,0.12)] border-solid inset-0 pointer-events-none rounded-[33554400px]" />
      <div className="flex flex-row items-center justify-center min-h-[inherit] size-full">
        <div className="content-stretch flex h-full items-center justify-center min-h-[inherit] pb-[13.5px] pt-[12.5px] px-[15px] relative">
          <div className="flex flex-col font-['Manrope:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#23211e] text-[14px] text-center whitespace-nowrap">
            <p className="leading-[14px]">Ведьмак</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function BackgroundBorder7() {
  return (
    <div className="bg-[#f0e8db] min-h-[40px] relative rounded-[33554400px] self-stretch shrink-0" data-name="Background+Border">
      <div aria-hidden="true" className="absolute border border-[rgba(41,38,34,0.12)] border-solid inset-0 pointer-events-none rounded-[33554400px]" />
      <div className="flex flex-row items-center justify-center min-h-[inherit] size-full">
        <div className="content-stretch flex h-full items-center justify-center min-h-[inherit] pb-[13.5px] pt-[12.5px] px-[15px] relative">
          <div className="flex flex-col font-['Manrope:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#23211e] text-[14px] text-center whitespace-nowrap">
            <p className="leading-[14px]">Мистика</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function BackgroundBorder8() {
  return (
    <div className="bg-[#f0e8db] min-h-[40px] relative rounded-[33554400px] self-stretch shrink-0" data-name="Background+Border">
      <div aria-hidden="true" className="absolute border border-[rgba(41,38,34,0.12)] border-solid inset-0 pointer-events-none rounded-[33554400px]" />
      <div className="flex flex-row items-center justify-center min-h-[inherit] size-full">
        <div className="content-stretch flex h-full items-center justify-center min-h-[inherit] pb-[13.5px] pt-[12.5px] px-[15px] relative">
          <div className="flex flex-col font-['Manrope:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#23211e] text-[14px] text-center whitespace-nowrap">
            <p className="leading-[14px]">NC-21</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function BackgroundBorder9() {
  return (
    <div className="bg-[#f0e8db] min-h-[40px] relative rounded-[33554400px] self-stretch shrink-0" data-name="Background+Border">
      <div aria-hidden="true" className="absolute border border-[rgba(41,38,34,0.12)] border-solid inset-0 pointer-events-none rounded-[33554400px]" />
      <div className="flex flex-row items-center justify-center min-h-[inherit] size-full">
        <div className="content-stretch flex h-full items-center justify-center min-h-[inherit] pb-[13.5px] pt-[12.5px] px-[15px] relative">
          <div className="flex flex-col font-['Manrope:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#23211e] text-[14px] text-center whitespace-nowrap">
            <p className="leading-[14px]">Драббл</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Container46() {
  return (
    <div className="content-stretch flex flex-wrap gap-[0px_8px] h-[40px] items-start relative shrink-0 w-full" data-name="Container">
      <BackgroundBorder5 />
      <BackgroundBorder6 />
      <BackgroundBorder7 />
      <BackgroundBorder8 />
      <BackgroundBorder9 />
    </div>
  );
}

function Background3() {
  return (
    <div className="bg-[#f7f2ea] relative rounded-[12px] self-stretch shrink-0" data-name="Background">
      <div className="content-stretch flex flex-col h-full items-start pb-[8.5px] pt-[7px] px-[11px] relative">
        <div className="flex flex-col font-['Manrope:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#23211e] text-[13px] whitespace-nowrap">
          <p className="leading-[19.5px]">Создана 27.03.2026</p>
        </div>
      </div>
    </div>
  );
}

function Background4() {
  return (
    <div className="bg-[#f7f2ea] relative rounded-[12px] self-stretch shrink-0" data-name="Background">
      <div className="content-stretch flex flex-col h-full items-start pb-[8.5px] pt-[7px] px-[11px] relative">
        <div className="flex flex-col font-['Manrope:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#23211e] text-[13px] whitespace-nowrap">
          <p className="leading-[19.5px]">Обновлена 30.03.2026</p>
        </div>
      </div>
    </div>
  );
}

function Container48() {
  return (
    <div className="content-stretch flex flex-wrap gap-[0px_10px] h-[35.5px] items-start relative shrink-0" data-name="Container">
      <Background3 />
      <Background4 />
    </div>
  );
}

function BackgroundBorderShadow1() {
  return (
    <div className="bg-[#bc5f3d] content-stretch flex items-center justify-center min-h-[40px] pb-[11.5px] pt-[10.5px] px-[15px] relative rounded-[15px] shrink-0" data-name="Background+Border+Shadow">
      <div aria-hidden="true" className="absolute border border-[rgba(0,0,0,0)] border-solid inset-0 pointer-events-none rounded-[15px] shadow-[0px_10px_24px_0px_rgba(188,95,61,0.18)]" />
      <div className="flex flex-col font-['Manrope:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[15px] text-center text-white tracking-[-0.15px] whitespace-nowrap">
        <p className="leading-[18px]">Открыть историю</p>
      </div>
    </div>
  );
}

function Container47() {
  return (
    <div className="content-end flex flex-wrap items-end justify-between pt-[4px] relative shrink-0 w-full" data-name="Container">
      <Container48 />
      <BackgroundBorderShadow1 />
    </div>
  );
}

function Container39() {
  return (
    <div className="col-2 justify-self-stretch relative row-1 self-start shrink-0" data-name="Container">
      <div className="content-stretch flex flex-col gap-[16px] items-start p-[20px] relative w-full">
        <Container40 />
        <Container46 />
        <Container47 />
      </div>
    </div>
  );
}

function Component() {
  return (
    <div className="aspect-[219/205.47999572753906] relative shrink-0 w-full" data-name="Обложка истории «Первая»">
      <div className="absolute bg-clip-padding border-0 border-[transparent] border-solid inset-0 overflow-hidden pointer-events-none">
        <img alt="" className="absolute h-[106.58%] left-0 max-w-none top-[-3.29%] w-full" src={img} />
      </div>
    </div>
  );
}

function BackgroundVerticalBorder1() {
  return (
    <div className="col-1 justify-self-stretch relative row-1 self-start shrink-0" data-name="Background+VerticalBorder" style={{ backgroundImage: "linear-gradient(135.131deg, rgb(240, 232, 219) 0%, rgb(247, 242, 234) 100%)" }}>
      <div className="content-stretch flex flex-col items-start justify-center overflow-clip pr-px relative rounded-[inherit] w-full">
        <Component />
      </div>
      <div aria-hidden="true" className="absolute border-[rgba(35,33,30,0.08)] border-r border-solid inset-0 pointer-events-none" />
    </div>
  );
}

function Container38() {
  return (
    <div className="h-[205.48px] relative shrink-0 w-full" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid grid grid-cols-[__220px_minmax(0,1fr)] grid-rows-[_205.48px] relative size-full">
        <Container39 />
        <BackgroundVerticalBorder1 />
      </div>
    </div>
  );
}

function Link5() {
  return (
    <div className="bg-[rgba(255,255,255,0.84)] relative rounded-[24px] shrink-0 w-full" data-name="Link">
      <div className="content-stretch flex flex-col items-start overflow-clip p-px relative rounded-[inherit] w-full">
        <Container38 />
      </div>
      <div aria-hidden="true" className="absolute border border-[rgba(35,33,30,0.08)] border-solid inset-0 pointer-events-none rounded-[24px]" />
    </div>
  );
}

function Container21() {
  return (
    <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full" data-name="Container">
      <Link4 />
      <Link5 />
    </div>
  );
}

function Container19() {
  return (
    <div className="col-2 content-stretch flex flex-col gap-[16px] items-start justify-self-stretch pb-[618.09px] relative row-1 self-start shrink-0" data-name="Container">
      <Container20 />
      <Container21 />
    </div>
  );
}

function Container4() {
  return (
    <div className="h-[1101.06px] relative shrink-0 w-[1382px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid gap-x-[20px] gap-y-[20px] grid grid-cols-[__272px_minmax(0,1fr)] grid-rows-[_1101.06px] relative size-full">
        <Aside />
        <Container19 />
      </div>
    </div>
  );
}

function Section() {
  return (
    <div className="bg-gradient-to-b from-[rgba(255,255,255,0.72)] relative rounded-[32px] shrink-0 to-[rgba(247,242,234,0.95)] w-[1440px]" data-name="Section">
      <div className="content-stretch flex flex-col gap-[12px] items-center overflow-clip pb-[29px] pt-px px-px relative rounded-[inherit] w-full">
        <Header />
        <Container4 />
      </div>
      <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.65)] border-solid inset-0 pointer-events-none rounded-[32px] shadow-[0px_24px_70px_0px_rgba(46,35,23,0.11)]" />
    </div>
  );
}

function Background() {
  return (
    <div className="min-h-[1200px] relative shrink-0 w-full" data-name="Background" style={{ backgroundImage: "linear-gradient(rgba(41, 38, 34, 0.03) 2.7778%, rgba(41, 38, 34, 0) 2.7778%), linear-gradient(90deg, rgba(41, 38, 34, 0.03) 2.7778%, rgba(41, 38, 34, 0) 2.7778%)" }}>
      <div className="flex flex-col items-center min-h-[inherit] size-full">
        <div className="content-stretch flex flex-col items-center min-h-[inherit] pb-[132px] pt-[32px] px-[24px] relative w-full">
          <Section />
        </div>
      </div>
    </div>
  );
}

export default function Component1920WLight() {
  return (
    <div className="content-stretch flex flex-col items-start relative size-full" data-name="1920w light" style={{ backgroundImage: "url('data:image/svg+xml;utf8,<svg viewBox=\\'0 0 1920 1376.1\\' xmlns=\\'http://www.w3.org/2000/svg\\' preserveAspectRatio=\\'none\\'><rect x=\\'0\\' y=\\'0\\' height=\\'100%\\' width=\\'100%\\' fill=\\'url(%23grad)\\' opacity=\\'1\\'/><defs><radialGradient id=\\'grad\\' gradientUnits=\\'userSpaceOnUse\\' cx=\\'0\\' cy=\\'0\\' r=\\'10\\' gradientTransform=\\'matrix(236.22 0 0 236.22 0 0)\\'><stop stop-color=\\'rgba(255,255,255,0.45)\\' offset=\\'0\\'/><stop stop-color=\\'rgba(255,255,255,0)\\' offset=\\'0.28\\'/></radialGradient></defs></svg>'), linear-gradient(rgb(228, 221, 210) 0%, rgb(217, 210, 196) 100%), linear-gradient(90deg, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 100%)" }}>
      <Background />
    </div>
  );
}