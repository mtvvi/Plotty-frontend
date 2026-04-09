function Link() {
  return (
    <div className="content-stretch flex flex-col items-start px-[16px] py-[8px] relative rounded-[14px] shrink-0" data-name="Link">
      <div className="flex flex-col font-['Manrope:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#23211e] text-[14px] whitespace-nowrap">
        <p className="leading-[20px]">Каталог</p>
      </div>
    </div>
  );
}

function Link1() {
  return (
    <div className="content-stretch flex flex-col items-start px-[16px] py-[8px] relative rounded-[14px] shrink-0" data-name="Link">
      <div className="flex flex-col font-['Manrope:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#23211e] text-[0px] whitespace-nowrap">
        <p className="leading-[20px] text-[14px]">Мастерская</p>
      </div>
    </div>
  );
}

function Nav() {
  return (
    <div className="content-stretch flex gap-[6px] items-center relative shrink-0" data-name="Nav - Основная навигация">
      <Link />
      <Link1 />
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

function Container4() {
  return (
    <div className="content-stretch flex flex-col items-end relative shrink-0" data-name="Container">
      <div className="flex flex-col font-['Manrope:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#23211e] text-[14px] text-right whitespace-nowrap">
        <p className="leading-[20px]">ilya</p>
      </div>
    </div>
  );
}

function Container3() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <Container4 />
    </div>
  );
}

function Button() {
  return (
    <div className="bg-[rgba(255,255,255,0.82)] content-stretch flex h-[42px] items-center justify-center min-h-[42px] px-[13px] py-[9px] relative rounded-[15px] shrink-0" data-name="Button">
      <div aria-hidden="true" className="absolute border border-[rgba(41,38,34,0.12)] border-solid inset-0 pointer-events-none rounded-[15px]" />
      <div className="flex flex-col font-['Manrope:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#23211e] text-[15px] text-center tracking-[-0.15px] whitespace-nowrap">
        <p className="leading-[18px]">Выйти</p>
      </div>
    </div>
  );
}

function Container2() {
  return (
    <div className="content-stretch flex gap-[7.99px] items-center relative shrink-0" data-name="Container">
      <Container3 />
      <Button />
    </div>
  );
}

function Container1() {
  return (
    <div className="content-stretch flex items-center relative shrink-0" data-name="Container">
      <Container2 />
    </div>
  );
}

function Margin() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-[102.80000305175781px] relative" data-name="Margin">
      <div className="flex flex-col items-end min-w-[inherit] size-full">
        <div className="content-stretch flex flex-col items-end min-w-[inherit] pl-[934.266px] relative w-full">
          <Container1 />
        </div>
      </div>
    </div>
  );
}

function Container() {
  return (
    <div className="min-h-[68px] relative shrink-0 w-full" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[16px] items-center min-h-[inherit] py-[13px] relative w-full">
        <div className="flex flex-col font-['Literata:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#23211e] text-[35.2px] tracking-[-1.408px] whitespace-nowrap">
          <p className="leading-[33.44px]">Plotty</p>
        </div>
        <NavMargin />
        <Margin />
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

function Container9() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Manrope:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#6d665d] text-[13px] tracking-[0.13px] uppercase whitespace-nowrap">
        <p className="leading-[18.85px]">Plotty story</p>
      </div>
    </div>
  );
}

function Container10() {
  return (
    <div className="content-stretch flex flex-col items-start max-w-[288px] pt-[0.6px] relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Manrope:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#23211e] text-[18px] tracking-[-0.36px] whitespace-nowrap">
        <p className="leading-[21.6px]">Капитан Марвел</p>
      </div>
    </div>
  );
}

function Container11() {
  return (
    <div className="content-stretch flex flex-col items-start max-w-[288px] relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Manrope:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#6d665d] text-[13px] tracking-[0.13px] whitespace-nowrap">
        <p className="leading-[18.85px] mb-0">Обложка появится автоматически, когда у</p>
        <p className="leading-[18.85px]">первой главы будет иллюстрация.</p>
      </div>
    </div>
  );
}

function Container8() {
  return (
    <div className="content-stretch flex flex-col gap-[7.4px] items-start relative shrink-0 w-[276px]" data-name="Container">
      <Container9 />
      <Container10 />
      <Container11 />
    </div>
  );
}

function Container7() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-full" data-name="Container">
      <div className="flex flex-row items-end size-full">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-end p-[20px] relative size-full">
          <Container8 />
        </div>
      </div>
    </div>
  );
}

function BackgroundVerticalBorder() {
  return (
    <div className="relative self-stretch shrink-0 w-[320px] z-[2]" data-name="Background+VerticalBorder" style={{ backgroundImage: "linear-gradient(135.09deg, rgb(240, 232, 219) 0%, rgb(247, 242, 234) 100%)" }}>
      <div className="content-stretch flex flex-col items-start justify-center overflow-clip pr-px relative rounded-[inherit] size-full">
        <Container7 />
      </div>
      <div aria-hidden="true" className="absolute border-[rgba(35,33,30,0.08)] border-r border-solid inset-0 pointer-events-none" />
    </div>
  );
}

function Container14() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Manrope:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#6d665d] text-[13px] tracking-[0.13px] uppercase w-full">
        <p className="leading-[18.85px]">История</p>
      </div>
    </div>
  );
}

function Heading() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Heading 1">
      <div className="flex flex-col font-['Literata:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#23211e] text-[52px] tracking-[-2.34px] w-full">
        <p className="leading-[50.96px]">Капитан Марвел</p>
      </div>
    </div>
  );
}

function Container15() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Manrope:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#6d665d] text-[13px] tracking-[0.13px] w-full">
        <p className="leading-[18.85px]">Обновлена 31.03.2026, 18:31:51</p>
      </div>
    </div>
  );
}

function Container13() {
  return (
    <div className="content-stretch flex flex-col gap-[6px] items-start relative shrink-0 w-full" data-name="Container">
      <Container14 />
      <Heading />
      <Container15 />
    </div>
  );
}

function Link2() {
  return (
    <div className="bg-[#bc5f3d] min-h-[42px] relative rounded-[15px] self-stretch shrink-0" data-name="Link">
      <div aria-hidden="true" className="absolute border border-[rgba(0,0,0,0)] border-solid inset-0 pointer-events-none rounded-[15px] shadow-[0px_10px_24px_0px_rgba(188,95,61,0.18)]" />
      <div className="flex flex-row items-center justify-center min-h-[inherit] size-full">
        <div className="content-stretch flex h-full items-center justify-center min-h-[inherit] px-[17px] py-[9px] relative">
          <div className="flex flex-col font-['Manrope:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[15px] text-center text-white tracking-[-0.15px] whitespace-nowrap">
            <p className="leading-[18px]">Читать</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Container16() {
  return (
    <div className="content-stretch flex flex-wrap h-[42px] items-start relative shrink-0 w-full" data-name="Container">
      <Link2 />
    </div>
  );
}

function OverlayBorder() {
  return (
    <div className="bg-[rgba(255,255,255,0.84)] min-h-[40px] relative rounded-[16777200px] self-stretch shrink-0" data-name="Overlay+Border">
      <div aria-hidden="true" className="absolute border border-[rgba(41,38,34,0.12)] border-solid inset-0 pointer-events-none rounded-[16777200px]" />
      <div className="flex flex-row items-center justify-center min-h-[inherit] size-full">
        <div className="content-stretch flex h-full items-center justify-center min-h-[inherit] px-[15px] py-[9px] relative">
          <div className="flex flex-col font-['Manrope:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#6d665d] text-[14px] text-center whitespace-nowrap">
            <p className="leading-[14px]">В процессе</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function OverlayBorder1() {
  return (
    <div className="bg-[rgba(255,255,255,0.84)] min-h-[40px] relative rounded-[16777200px] self-stretch shrink-0" data-name="Overlay+Border">
      <div aria-hidden="true" className="absolute border border-[rgba(41,38,34,0.12)] border-solid inset-0 pointer-events-none rounded-[16777200px]" />
      <div className="flex flex-row items-center justify-center min-h-[inherit] size-full">
        <div className="content-stretch flex h-full items-center justify-center min-h-[inherit] px-[15px] py-[9px] relative">
          <div className="flex flex-col font-['Manrope:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#6d665d] text-[14px] text-center whitespace-nowrap">
            <p className="leading-[14px]">DC</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function OverlayBorder2() {
  return (
    <div className="bg-[rgba(255,255,255,0.84)] min-h-[40px] relative rounded-[16777200px] self-stretch shrink-0" data-name="Overlay+Border">
      <div aria-hidden="true" className="absolute border border-[rgba(41,38,34,0.12)] border-solid inset-0 pointer-events-none rounded-[16777200px]" />
      <div className="flex flex-row items-center justify-center min-h-[inherit] size-full">
        <div className="content-stretch flex h-full items-center justify-center min-h-[inherit] px-[15px] py-[9px] relative">
          <div className="flex flex-col font-['Manrope:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#6d665d] text-[14px] text-center whitespace-nowrap">
            <p className="leading-[14px]">Драма</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function OverlayBorder3() {
  return (
    <div className="bg-[rgba(255,255,255,0.84)] min-h-[40px] relative rounded-[16777200px] self-stretch shrink-0" data-name="Overlay+Border">
      <div aria-hidden="true" className="absolute border border-[rgba(41,38,34,0.12)] border-solid inset-0 pointer-events-none rounded-[16777200px]" />
      <div className="flex flex-row items-center justify-center min-h-[inherit] size-full">
        <div className="content-stretch flex h-full items-center justify-center min-h-[inherit] px-[15px] py-[9px] relative">
          <div className="flex flex-col font-['Manrope:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#6d665d] text-[14px] text-center whitespace-nowrap">
            <p className="leading-[14px]">NC-17</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function OverlayBorder4() {
  return (
    <div className="bg-[rgba(255,255,255,0.84)] min-h-[40px] relative rounded-[16777200px] self-stretch shrink-0" data-name="Overlay+Border">
      <div aria-hidden="true" className="absolute border border-[rgba(41,38,34,0.12)] border-solid inset-0 pointer-events-none rounded-[16777200px]" />
      <div className="flex flex-row items-center justify-center min-h-[inherit] size-full">
        <div className="content-stretch flex h-full items-center justify-center min-h-[inherit] px-[15px] py-[9px] relative">
          <div className="flex flex-col font-['Manrope:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#6d665d] text-[14px] text-center whitespace-nowrap">
            <p className="leading-[14px]">Макси</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function OverlayBorder5() {
  return (
    <div className="bg-[rgba(255,255,255,0.84)] min-h-[40px] relative rounded-[16777200px] self-stretch shrink-0" data-name="Overlay+Border">
      <div aria-hidden="true" className="absolute border border-[rgba(41,38,34,0.12)] border-solid inset-0 pointer-events-none rounded-[16777200px]" />
      <div className="flex flex-row items-center justify-center min-h-[inherit] size-full">
        <div className="content-stretch flex h-full items-center justify-center min-h-[inherit] px-[15px] py-[9px] relative">
          <div className="flex flex-col font-['Manrope:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#6d665d] text-[14px] text-center whitespace-nowrap">
            <p className="leading-[14px]">OOC</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Container17() {
  return (
    <div className="content-stretch flex flex-wrap gap-[0px_8px] h-[40px] items-start relative shrink-0 w-full" data-name="Container">
      <OverlayBorder />
      <OverlayBorder1 />
      <OverlayBorder2 />
      <OverlayBorder3 />
      <OverlayBorder4 />
      <OverlayBorder5 />
    </div>
  );
}

function Container12() {
  return (
    <div className="relative self-stretch shrink-0 w-[1016px] z-[1]" data-name="Container">
      <div className="content-stretch flex flex-col gap-[16px] items-start p-[24px] relative size-full">
        <Container13 />
        <Container16 />
        <Container17 />
      </div>
    </div>
  );
}

function Container6() {
  return (
    <div className="h-[398.75px] min-h-[398.75px] relative shrink-0 w-full" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex isolate items-start justify-center min-h-[inherit] relative size-full">
        <BackgroundVerticalBorder />
        <Container12 />
      </div>
    </div>
  );
}

function OverlayBorderShadow() {
  return (
    <div className="bg-[rgba(255,255,255,0.78)] relative rounded-[24px] shrink-0 w-full" data-name="Overlay+Border+Shadow">
      <div className="overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex flex-col items-start p-[23px] relative w-full">
          <Container6 />
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-[rgba(41,38,34,0.12)] border-solid inset-0 pointer-events-none rounded-[24px] shadow-[0px_10px_30px_0px_rgba(46,35,23,0.08)]" />
    </div>
  );
}

function Button1() {
  return (
    <div className="bg-[rgba(255,255,255,0.82)] content-stretch flex items-center justify-center min-h-[42px] pb-[12.25px] pt-[11.75px] px-[17px] relative rounded-[15px] shrink-0" data-name="Button">
      <div aria-hidden="true" className="absolute border border-[rgba(41,38,34,0.12)] border-solid inset-0 pointer-events-none rounded-[15px]" />
      <div className="flex flex-col font-['Manrope:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#23211e] text-[15px] text-center tracking-[-0.15px] whitespace-nowrap">
        <p className="leading-[18px]">Описание</p>
      </div>
    </div>
  );
}

function Button2() {
  return (
    <div className="bg-[#bc5f3d] content-stretch flex items-center justify-center min-h-[42px] pb-[12.25px] pt-[11.75px] px-[17px] relative rounded-[15px] shrink-0" data-name="Button">
      <div aria-hidden="true" className="absolute border border-[rgba(0,0,0,0)] border-solid inset-0 pointer-events-none rounded-[15px] shadow-[0px_10px_24px_0px_rgba(188,95,61,0.18)]" />
      <div className="flex flex-col font-['Manrope:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[15px] text-center text-white tracking-[-0.15px] whitespace-nowrap">
        <p className="leading-[18px]">Главы</p>
      </div>
    </div>
  );
}

function Container18() {
  return (
    <div className="content-start flex flex-wrap gap-[0px_10px] items-start relative shrink-0 w-full" data-name="Container">
      <Button1 />
      <Button2 />
    </div>
  );
}

function Container20() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Manrope:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#23211e] text-[17.6px] tracking-[-0.352px] whitespace-nowrap">
        <p className="leading-[22px]">Глава 1. Начало</p>
      </div>
    </div>
  );
}

function Container21() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Manrope:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#6d665d] text-[13px] tracking-[0.13px] whitespace-nowrap">
        <p className="leading-[18.85px]">Обновлена 31.03.2026, 18:32:01</p>
      </div>
    </div>
  );
}

function Container19() {
  return (
    <div className="relative shrink-0 w-[203px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[4px] items-start relative w-full">
        <Container20 />
        <Container21 />
      </div>
    </div>
  );
}

function Link3() {
  return (
    <div className="bg-[#bc5f3d] min-h-[42px] relative rounded-[15px] self-stretch shrink-0" data-name="Link">
      <div aria-hidden="true" className="absolute border border-[rgba(0,0,0,0)] border-solid inset-0 pointer-events-none rounded-[15px] shadow-[0px_10px_24px_0px_rgba(188,95,61,0.18)]" />
      <div className="flex flex-row items-center justify-center min-h-[inherit] size-full">
        <div className="content-stretch flex h-full items-center justify-center min-h-[inherit] px-[17px] py-[9px] relative">
          <div className="flex flex-col font-['Manrope:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[15px] text-center text-white tracking-[-0.15px] whitespace-nowrap">
            <p className="leading-[18px]">Читать</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Container22() {
  return (
    <div className="h-[42px] relative shrink-0" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-wrap h-full items-start relative">
        <Link3 />
      </div>
    </div>
  );
}

function OverlayBorder6() {
  return (
    <div className="bg-[rgba(255,255,255,0.76)] relative rounded-[18px] shrink-0 w-full" data-name="Overlay+Border">
      <div aria-hidden="true" className="absolute border border-[rgba(41,38,34,0.12)] border-solid inset-0 pointer-events-none rounded-[18px]" />
      <div className="flex flex-row items-center size-full">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-center flex flex-wrap items-center justify-between px-[17px] py-[15px] relative w-full">
          <Container19 />
          <Container22 />
        </div>
      </div>
    </div>
  );
}

function OverlayBorderShadow1() {
  return (
    <div className="bg-[rgba(255,255,255,0.78)] relative rounded-[24px] shrink-0 w-full" data-name="Overlay+Border+Shadow">
      <div aria-hidden="true" className="absolute border border-[rgba(41,38,34,0.12)] border-solid inset-0 pointer-events-none rounded-[24px] shadow-[0px_10px_30px_0px_rgba(46,35,23,0.08)]" />
      <div className="content-stretch flex flex-col items-start p-[23px] relative w-full">
        <OverlayBorder6 />
      </div>
    </div>
  );
}

function Container5() {
  return (
    <div className="relative shrink-0 w-[1382px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[20px] items-start relative w-full">
        <OverlayBorderShadow />
        <Container18 />
        <OverlayBorderShadow1 />
      </div>
    </div>
  );
}

function Section() {
  return (
    <div className="bg-gradient-to-b from-[rgba(255,255,255,0.72)] relative rounded-[32px] shrink-0 to-[rgba(247,242,234,0.95)] w-[1440px]" data-name="Section">
      <div className="content-stretch flex flex-col gap-[18px] items-center overflow-clip pb-[29px] pt-px px-px relative rounded-[inherit] w-full">
        <Header />
        <Container5 />
      </div>
      <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.65)] border-solid inset-0 pointer-events-none rounded-[32px] shadow-[0px_24px_70px_0px_rgba(46,35,23,0.11)]" />
    </div>
  );
}

function Background() {
  return (
    <div className="min-h-[1200px] relative shrink-0 w-full" data-name="Background" style={{ backgroundImage: "linear-gradient(rgba(41, 38, 34, 0.03) 2.7778%, rgba(41, 38, 34, 0) 2.7778%), linear-gradient(90deg, rgba(41, 38, 34, 0.03) 2.7778%, rgba(41, 38, 34, 0) 2.7778%)" }}>
      <div className="flex flex-col items-center min-h-[inherit] size-full">
        <div className="content-stretch flex flex-col items-center min-h-[inherit] pb-[403.41px] pt-[32px] px-[32px] relative w-full">
          <Section />
        </div>
      </div>
    </div>
  );
}

export default function Component1920WDefault() {
  return (
    <div className="content-stretch flex flex-col items-start relative size-full" data-name="1920w default" style={{ backgroundImage: "url('data:image/svg+xml;utf8,<svg viewBox=\\'0 0 1920 1200.2\\' xmlns=\\'http://www.w3.org/2000/svg\\' preserveAspectRatio=\\'none\\'><rect x=\\'0\\' y=\\'0\\' height=\\'100%\\' width=\\'100%\\' fill=\\'url(%23grad)\\' opacity=\\'1\\'/><defs><radialGradient id=\\'grad\\' gradientUnits=\\'userSpaceOnUse\\' cx=\\'0\\' cy=\\'0\\' r=\\'10\\' gradientTransform=\\'matrix(226.42 0 0 226.45 0 0)\\'><stop stop-color=\\'rgba(255,255,255,0.45)\\' offset=\\'0\\'/><stop stop-color=\\'rgba(255,255,255,0)\\' offset=\\'0.28\\'/></radialGradient></defs></svg>'), linear-gradient(rgb(228, 221, 210) 0%, rgb(217, 210, 196) 100%), linear-gradient(90deg, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 100%)" }}>
      <Background />
    </div>
  );
}