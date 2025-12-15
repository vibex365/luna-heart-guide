import couplesMarketingBg from "@/assets/couples-marketing-bg.png";

const CouplesMarketingHero = () => {
  return (
    <div className="relative w-full aspect-[9/16] max-w-md mx-auto overflow-hidden rounded-2xl">
      {/* Background Image */}
      <img
        src={couplesMarketingBg}
        alt="Couples app preview"
        className="absolute inset-0 w-full h-full object-cover"
      />
      
      {/* Text Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-start pt-16 px-6">
        {/* Badge */}
        <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
          <span className="text-white text-sm font-medium tracking-wide">
            For Couples • AI-Powered
          </span>
        </div>
        
        {/* Headline */}
        <h1 className="text-white text-4xl md:text-5xl font-bold text-center leading-tight font-heading">
          strengthen your
          <br />
          relationship
          <br />
          together
        </h1>
      </div>
    </div>
  );
};

export default CouplesMarketingHero;
