import img from "figma:asset/57b3484033585072e5824b23e95837e826bb4bbd.png";

function Link() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Link">
      <div className="flex flex-col font-['Literata:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#23211e] text-[0px] tracking-[-1.166px] whitespace-nowrap">
        <p className="leading-[27.69px] text-[29.2px]">Plotty</p>
      </div>
    </div>
  );
}

function Container3() {
  return (
    <div className="col-1 justify-self-stretch relative row-1 self-center shrink-0" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative w-full">
        <div className="flex flex-col font-['Manrope:Regular','Noto_Sans_Symbols:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#6d665d] text-[16px] whitespace-nowrap">
          <p className="leading-[24px]">⌕</p>
        </div>
      </div>
    </div>
  );
}

function Container4() {
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
    <div className="col-2 justify-self-stretch min-h-[40px] relative rounded-[16px] row-1 self-center shrink-0" data-name="Input - Поиск по названию истории">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start min-h-[inherit] overflow-clip py-[9px] relative rounded-[inherit] w-full">
        <Container4 />
      </div>
    </div>
  );
}

function OverlayBorder() {
  return (
    <div className="bg-[rgba(255,255,255,0.84)] h-[46px] relative rounded-[16px] shrink-0 w-full" data-name="Overlay+Border">
      <div aria-hidden="true" className="absolute border border-[rgba(35,33,30,0.08)] border-solid inset-0 pointer-events-none rounded-[16px]" />
      <div className="gap-x-[12px] gap-y-[12px] grid grid-cols-[__8.97px_minmax(0,1fr)] grid-rows-[_40px] px-[17px] py-[3px] relative size-full">
        <Container3 />
        <Input />
      </div>
    </div>
  );
}

function Container2() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative" data-name="Container">
      <div className="content-stretch flex flex-col items-start pl-[4px] relative w-full">
        <OverlayBorder />
      </div>
    </div>
  );
}

function Container1() {
  return (
    <div className="content-stretch flex gap-[12px] items-center min-h-[62px] py-[8px] relative shrink-0 w-full" data-name="Container">
      <Link />
      <Container2 />
    </div>
  );
}

function Button() {
  return (
    <div className="bg-[rgba(255,255,255,0.82)] min-h-[42px] relative rounded-[15px] shrink-0 w-full" data-name="Button - Открыть фильтры">
      <div aria-hidden="true" className="absolute border border-[rgba(41,38,34,0.12)] border-solid inset-0 pointer-events-none rounded-[15px]" />
      <div className="flex flex-row items-center justify-center min-h-[inherit] size-full">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center min-h-[inherit] pb-[12.5px] pt-[11.5px] px-[17px] relative w-full">
          <div className="flex flex-col font-['Manrope:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#23211e] text-[15px] text-center tracking-[-0.15px] whitespace-nowrap">
            <p className="leading-[18px]">Фильтр</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function HorizontalBorder() {
  return (
    <div className="content-stretch flex flex-col items-start pb-[12px] pt-[13px] relative shrink-0 w-full" data-name="HorizontalBorder">
      <div aria-hidden="true" className="absolute border-[rgba(41,38,34,0.12)] border-solid border-t inset-0 pointer-events-none" />
      <Button />
    </div>
  );
}

function Container() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start px-[24px] relative w-full">
        <Container1 />
        <HorizontalBorder />
      </div>
    </div>
  );
}

function Header() {
  return (
    <div className="backdrop-blur-[12px] bg-[rgba(247,242,234,0.78)] shrink-0 sticky top-0 w-full" data-name="Header">
      <div aria-hidden="true" className="absolute border-[rgba(41,38,34,0.12)] border-b border-solid inset-0 pointer-events-none" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pb-px relative w-full">
        <Container />
      </div>
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

function Container6() {
  return (
    <div className="content-center flex flex-wrap items-center relative shrink-0 w-full" data-name="Container">
      <OverlayShadow />
    </div>
  );
}

function Heading() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Heading 2">
      <div className="flex flex-col font-['Manrope:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#23211e] text-[17.6px] tracking-[-0.352px] whitespace-nowrap">
        <p className="leading-[22px]">Капитан Марвел</p>
      </div>
    </div>
  );
}

function Container13() {
  return (
    <div className="relative self-stretch shrink-0 w-[18.03px]" data-name="Container">
      <div className="-translate-y-1/2 absolute flex flex-col font-['Manrope:Regular',sans-serif] font-normal h-[20px] justify-center leading-[0] left-0 text-[#6d665d] text-[13px] top-[9px] w-[18.336px]">
        <p className="leading-[19.5px]">DC</p>
      </div>
    </div>
  );
}

function Container14() {
  return (
    <div className="relative self-stretch shrink-0 w-[35.27px]" data-name="Container">
      <div className="-translate-y-1/2 absolute flex flex-col font-['Manrope:Regular',sans-serif] font-normal h-[20px] justify-center leading-[0] left-0 text-[#6d665d] text-[13px] top-[9px] w-[35.577px]">
        <p className="leading-[19.5px]">NC-17</p>
      </div>
    </div>
  );
}

function Container15() {
  return (
    <div className="relative self-stretch shrink-0 w-[70.78px]" data-name="Container">
      <div className="-translate-y-1/2 absolute flex flex-col font-['Manrope:Regular',sans-serif] font-normal h-[20px] justify-center leading-[0] left-0 text-[#6d665d] text-[13px] top-[9px] w-[71.089px]">
        <p className="leading-[19.5px]">В процессе</p>
      </div>
    </div>
  );
}

function Container12() {
  return (
    <div className="content-stretch flex flex-wrap gap-[0px_10px] h-[19.5px] items-start relative shrink-0 w-full" data-name="Container">
      <Container13 />
      <Container14 />
      <Container15 />
    </div>
  );
}

function Container11() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-[144.08px]" data-name="Container">
      <Heading />
      <Container12 />
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

function Container10() {
  return (
    <div className="content-start flex flex-wrap items-start justify-between relative shrink-0 w-full" data-name="Container">
      <Container11 />
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

function Container16() {
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

function Container18() {
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

function Container17() {
  return (
    <div className="content-stretch flex flex-col gap-[12px] items-start justify-end pt-[4px] relative shrink-0 w-full" data-name="Container">
      <Container18 />
      <BackgroundBorderShadow />
    </div>
  );
}

function Container9() {
  return (
    <div className="col-2 justify-self-stretch relative row-1 self-start shrink-0" data-name="Container">
      <div className="content-stretch flex flex-col gap-[16px] items-start p-[20px] relative w-full">
        <Container10 />
        <Container16 />
        <Container17 />
      </div>
    </div>
  );
}

function Container21() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Manrope:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#6d665d] text-[13px] tracking-[0.13px] uppercase whitespace-nowrap">
        <p className="leading-[18.85px]">Plotty story</p>
      </div>
    </div>
  );
}

function Container22() {
  return (
    <div className="content-stretch flex flex-col items-start max-w-[224px] pb-[0.59px] relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Manrope:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#23211e] text-[18px] tracking-[-0.36px] whitespace-nowrap">
        <p className="leading-[21.6px]">Капитан Марвел</p>
      </div>
    </div>
  );
}

function Container23() {
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

function Container20() {
  return (
    <div className="content-stretch flex flex-col gap-[7px] items-start min-w-[187px] relative shrink-0 w-[187px]" data-name="Container">
      <Container21 />
      <Container22 />
      <Container23 />
    </div>
  );
}

function Container19() {
  return (
    <div className="aspect-[219/252.97999572753906] relative shrink-0" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-end pb-[16px] pt-[105.17px] px-[16px] relative w-full">
        <Container20 />
      </div>
    </div>
  );
}

function BackgroundVerticalBorder() {
  return (
    <div className="col-1 justify-self-stretch relative row-1 self-start shrink-0" data-name="Background+VerticalBorder" style={{ backgroundImage: "linear-gradient(135.155deg, rgb(240, 232, 219) 0%, rgb(247, 242, 234) 100%)" }}>
      <div className="content-stretch flex flex-col items-start justify-center overflow-clip pr-px relative rounded-[inherit] w-full">
        <Container19 />
      </div>
      <div aria-hidden="true" className="absolute border-[rgba(35,33,30,0.08)] border-r border-solid inset-0 pointer-events-none" />
    </div>
  );
}

function Container8() {
  return (
    <div className="h-[252.98px] relative shrink-0 w-full" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid grid grid-cols-[__220px_minmax(0,1fr)] grid-rows-[_252.98px] relative size-full">
        <Container9 />
        <BackgroundVerticalBorder />
      </div>
    </div>
  );
}

function Link1() {
  return (
    <div className="bg-[rgba(255,255,255,0.84)] relative rounded-[24px] shrink-0 w-full" data-name="Link">
      <div className="content-stretch flex flex-col items-start overflow-clip p-px relative rounded-[inherit] w-full">
        <Container8 />
      </div>
      <div aria-hidden="true" className="absolute border border-[rgba(35,33,30,0.08)] border-solid inset-0 pointer-events-none rounded-[24px]" />
    </div>
  );
}

function Heading1() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Heading 2">
      <div className="flex flex-col font-['Manrope:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#23211e] text-[17.6px] tracking-[-0.352px] whitespace-nowrap">
        <p className="leading-[22px]">Первая</p>
      </div>
    </div>
  );
}

function Container29() {
  return (
    <div className="relative self-stretch shrink-0 w-[52.97px]" data-name="Container">
      <div className="-translate-y-1/2 absolute flex flex-col font-['Manrope:Regular',sans-serif] font-normal h-[20px] justify-center leading-[0] left-0 text-[#6d665d] text-[13px] top-[9px] w-[53.332px]">
        <p className="leading-[19.5px]">Ведьмак</p>
      </div>
    </div>
  );
}

function Container30() {
  return (
    <div className="relative self-stretch shrink-0 w-[36.14px]" data-name="Container">
      <div className="-translate-y-1/2 absolute flex flex-col font-['Manrope:Regular',sans-serif] font-normal h-[20px] justify-center leading-[0] left-0 text-[#6d665d] text-[13px] top-[9px] w-[36.45px]">
        <p className="leading-[19.5px]">NC-21</p>
      </div>
    </div>
  );
}

function Container31() {
  return (
    <div className="relative self-stretch shrink-0 w-[70.78px]" data-name="Container">
      <div className="-translate-y-1/2 absolute flex flex-col font-['Manrope:Regular',sans-serif] font-normal h-[20px] justify-center leading-[0] left-0 text-[#6d665d] text-[13px] top-[9px] w-[71.089px]">
        <p className="leading-[19.5px]">В процессе</p>
      </div>
    </div>
  );
}

function Container28() {
  return (
    <div className="content-stretch flex flex-wrap gap-[0px_10px] h-[19.5px] items-start relative shrink-0 w-full" data-name="Container">
      <Container29 />
      <Container30 />
      <Container31 />
    </div>
  );
}

function Container27() {
  return (
    <div className="content-stretch flex flex-col gap-[8.01px] items-start relative shrink-0 w-[179.89px]" data-name="Container">
      <Heading1 />
      <Container28 />
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

function Container26() {
  return (
    <div className="content-start flex flex-wrap items-start justify-between relative shrink-0 w-full" data-name="Container">
      <Container27 />
      <Overlay1 />
    </div>
  );
}

function BackgroundBorder5() {
  return (
    <div className="absolute bg-[#f0e8db] bottom-[48px] content-stretch flex items-center justify-center left-0 min-h-[40px] pb-[13.5px] pt-[12.5px] px-[15px] rounded-[33554400px] top-0" data-name="Background+Border">
      <div aria-hidden="true" className="absolute border border-[rgba(41,38,34,0.12)] border-solid inset-0 pointer-events-none rounded-[33554400px]" />
      <div className="flex flex-col font-['Manrope:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#23211e] text-[14px] text-center whitespace-nowrap">
        <p className="leading-[14px]">В процессе</p>
      </div>
    </div>
  );
}

function BackgroundBorder6() {
  return (
    <div className="absolute bg-[#f0e8db] bottom-[48px] content-stretch flex items-center justify-center left-[116.31px] min-h-[40px] pb-[13.5px] pt-[12.5px] px-[15px] rounded-[33554400px] top-0" data-name="Background+Border">
      <div aria-hidden="true" className="absolute border border-[rgba(41,38,34,0.12)] border-solid inset-0 pointer-events-none rounded-[33554400px]" />
      <div className="flex flex-col font-['Manrope:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#23211e] text-[14px] text-center whitespace-nowrap">
        <p className="leading-[14px]">Ведьмак</p>
      </div>
    </div>
  );
}

function BackgroundBorder7() {
  return (
    <div className="absolute bg-[#f0e8db] bottom-[48px] content-stretch flex items-center justify-center left-[213.22px] min-h-[40px] pb-[13.5px] pt-[12.5px] px-[15px] rounded-[33554400px] top-0" data-name="Background+Border">
      <div aria-hidden="true" className="absolute border border-[rgba(41,38,34,0.12)] border-solid inset-0 pointer-events-none rounded-[33554400px]" />
      <div className="flex flex-col font-['Manrope:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#23211e] text-[14px] text-center whitespace-nowrap">
        <p className="leading-[14px]">Мистика</p>
      </div>
    </div>
  );
}

function BackgroundBorder8() {
  return (
    <div className="absolute bg-[#f0e8db] bottom-[48px] content-stretch flex items-center justify-center left-[310.3px] min-h-[40px] pb-[13.5px] pt-[12.5px] px-[15px] rounded-[33554400px] top-0" data-name="Background+Border">
      <div aria-hidden="true" className="absolute border border-[rgba(41,38,34,0.12)] border-solid inset-0 pointer-events-none rounded-[33554400px]" />
      <div className="flex flex-col font-['Manrope:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#23211e] text-[14px] text-center whitespace-nowrap">
        <p className="leading-[14px]">NC-21</p>
      </div>
    </div>
  );
}

function BackgroundBorder9() {
  return (
    <div className="absolute bg-[#f0e8db] bottom-0 content-stretch flex items-center justify-center left-0 min-h-[40px] pb-[13.5px] pt-[12.5px] px-[15px] rounded-[33554400px] top-[48px]" data-name="Background+Border">
      <div aria-hidden="true" className="absolute border border-[rgba(41,38,34,0.12)] border-solid inset-0 pointer-events-none rounded-[33554400px]" />
      <div className="flex flex-col font-['Manrope:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#23211e] text-[14px] text-center whitespace-nowrap">
        <p className="leading-[14px]">Драббл</p>
      </div>
    </div>
  );
}

function Container32() {
  return (
    <div className="h-[88px] relative shrink-0 w-full" data-name="Container">
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

function Container34() {
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

function Container33() {
  return (
    <div className="content-stretch flex flex-col gap-[12px] items-start justify-end pt-[4px] relative shrink-0 w-full" data-name="Container">
      <Container34 />
      <BackgroundBorderShadow1 />
    </div>
  );
}

function Container25() {
  return (
    <div className="col-2 justify-self-stretch relative row-1 self-start shrink-0" data-name="Container">
      <div className="content-stretch flex flex-col gap-[16px] items-start p-[20px] relative w-full">
        <Container26 />
        <Container32 />
        <Container33 />
      </div>
    </div>
  );
}

function Component() {
  return (
    <div className="aspect-[219/300.9800109863281] relative shrink-0 w-full" data-name="Обложка истории «Первая»">
      <div className="absolute bg-clip-padding border-0 border-[transparent] border-solid inset-0 overflow-hidden pointer-events-none">
        <img alt="" className="absolute h-full left-[-18.72%] max-w-none top-0 w-[137.43%]" src={img} />
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

function Container24() {
  return (
    <div className="h-[300.98px] relative shrink-0 w-full" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid grid grid-cols-[__220px_minmax(0,1fr)] grid-rows-[_300.98px] relative size-full">
        <Container25 />
        <BackgroundVerticalBorder1 />
      </div>
    </div>
  );
}

function Link2() {
  return (
    <div className="bg-[rgba(255,255,255,0.84)] relative rounded-[24px] shrink-0 w-full" data-name="Link">
      <div className="content-stretch flex flex-col items-start overflow-clip p-px relative rounded-[inherit] w-full">
        <Container24 />
      </div>
      <div aria-hidden="true" className="absolute border border-[rgba(35,33,30,0.08)] border-solid inset-0 pointer-events-none rounded-[24px]" />
    </div>
  );
}

function Container7() {
  return (
    <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full" data-name="Container">
      <Link1 />
      <Link2 />
    </div>
  );
}

function Container5() {
  return (
    <div className="relative shrink-0 w-[686px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[12px] items-start relative w-full">
        <Container6 />
        <Container7 />
      </div>
    </div>
  );
}

function Section() {
  return (
    <div className="bg-gradient-to-b from-[rgba(255,255,255,0.72)] relative rounded-[32px] shrink-0 to-[rgba(247,242,234,0.95)] w-[736px]" data-name="Section">
      <div className="content-stretch flex flex-col gap-[8px] items-center overflow-clip pb-[25px] pt-px px-px relative rounded-[inherit] w-full">
        <Header />
        <Container5 />
      </div>
      <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.65)] border-solid inset-0 pointer-events-none rounded-[32px] shadow-[0px_24px_70px_0px_rgba(46,35,23,0.11)]" />
    </div>
  );
}

export default function Background() {
  return (
    <div className="content-stretch flex flex-col items-center pb-[750.03px] px-[16px] relative size-full" data-name="Background" style={{ backgroundImage: "linear-gradient(rgba(41, 38, 34, 0.03) 2.7778%, rgba(41, 38, 34, 0) 2.7778%), linear-gradient(90deg, rgba(41, 38, 34, 0.03) 2.7778%, rgba(41, 38, 34, 0) 2.7778%)" }}>
      <Section />
    </div>
  );
}