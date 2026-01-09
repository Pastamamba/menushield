import React, { useState } from "react";
import { useMenuTranslations } from "../hooks/useMenuTranslations";

interface AllergenDisclaimerProps {
  isOpen: boolean;
  onAccept: () => void;
  onDecline?: () => void;
  restaurantName?: string;
}

export default function AllergenDisclaimer({ 
  isOpen, 
  onAccept, 
  onDecline, 
  restaurantName = "this restaurant" 
}: AllergenDisclaimerProps) {
  const { currentLanguage } = useMenuTranslations();
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);

  if (!isOpen) return null;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const isAtBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 10;
    if (isAtBottom) {
      setHasScrolledToBottom(true);
    }
  };

  const getDisclaimerText = () => {
    switch (currentLanguage) {
      case 'fi':
        return {
          title: "Allergeenivastuuvapautuslauseke",
          content: `
**TÄRKEÄÄ - LUE HUOLELLISESTI**

MenuShield-järjestelmä tarjoaa allergeeni-informaatiota helpottamaan ruokavaliovalintojasi. Huomioithan kuitenkin seuraavat tärkeät seikat:

**Vastuuvapautuslauseke:**

• **Ei korvaa henkilökohtaista konsultaatiota**: Tämä järjestelmä ei korvaa keskustelua ravintolan henkilökunnan kanssa allergeenien suhteen.

• **Tietojen tarkkuus**: Vaikka pyrimme tarjoamaan tarkan allergeeni-informaation, ${restaurantName} ei takaa tietojen täydellistä oikeellisuutta.

• **Ristiinsaastumisen riski**: Keittiössä voi tapahtua ristiinsaastumista eri allergeenien välillä, vaikka ruoka ei sisältäisikään kyseisiä ainesosia suoraan.

• **Muutokset resepteissä**: Reseptit ja toimittajat voivat muuttua ilman ennakkoilmoitusta.

• **Henkilökohtainen vastuu**: Sinulla on henkilökohtainen vastuu omasta turvallisuudestasi. Konsultoi aina henkilökuntaa vakavien allergioiden osalta.

**Suosituksemme:**
- Kerro aina henkilökunnalle allergioistasi
- Kysy epäselvissä tapauksissa
- Jos sinulla on vakava allergia, keskustele keittiön kanssa suoraan

**Jatkamalla hyväksyt**, että käytät tätä järjestelmää omalla vastuullasi ja ymmärrät, että ${restaurantName} ei ole vastuussa allergisista reaktioista, jotka voivat aiheutua tarjoilemistamme ruoista.
          `,
          accept: "Ymmärrän ja hyväksyn vastuut",
          decline: "En hyväksy",
          scrollNotice: "Ole hyvä ja lue koko vastuuvapautuslauseke loppuun saakka"
        };
      case 'sv':
        return {
          title: "Allergenansvarsbefrielse",
          content: `
**VIKTIGT - LÄS NOGGRANT**

MenuShield-systemet tillhandahåller allergeninformation för att underlätta dina matval. Vänligen observera följande viktiga punkter:

**Ansvarsbefrielse:**

• **Ersätter inte personlig konsultation**: Detta system ersätter inte samtal med restaurangpersonalen angående allergener.

• **Informationsnoggrannhet**: Även om vi strävar efter att tillhandahålla korrekt allergeninformation, garanterar inte ${restaurantName} informationens fullständiga riktighet.

• **Risk för korskontaminering**: Korskontaminering kan förekomma i köket mellan olika allergener, även om maten inte innehåller dessa ingredienser direkt.

• **Ändringar i recept**: Recept och leverantörer kan ändras utan förvarning.

• **Personligt ansvar**: Du har personligt ansvar för din egen säkerhet. Konsultera alltid personalen vid allvarliga allergier.

**Vår rekommendation:**
- Informera alltid personalen om dina allergier
- Fråga vid osäkerhet
- Om du har allvarlig allergi, tala direkt med köket

**Genom att fortsätta accepterar du** att du använder detta system på egen risk och förstår att ${restaurantName} inte är ansvariga för allergiska reaktioner som kan uppstå från maten vi serverar.
          `,
          accept: "Jag förstår och accepterar ansvaret",
          decline: "Jag accepterar inte",
          scrollNotice: "Vänligen läs hela ansvarsbefrielsen till slutet"
        };
      default: // English
        return {
          title: "Allergen Responsibility Disclaimer",
          content: `
**IMPORTANT - PLEASE READ CAREFULLY**

The MenuShield system provides allergen information to help you make informed food choices. However, please note the following important considerations:

**Disclaimer of Liability:**

• **Not a substitute for personal consultation**: This system does not replace direct communication with restaurant staff regarding allergens.

• **Information accuracy**: While we strive to provide accurate allergen information, ${restaurantName} cannot guarantee the complete accuracy of all information.

• **Cross-contamination risk**: Cross-contamination may occur in the kitchen between different allergens, even if the dish does not directly contain those ingredients.

• **Recipe changes**: Recipes and suppliers may change without advance notice.

• **Personal responsibility**: You have personal responsibility for your own safety. Always consult with staff regarding severe allergies.

**Our recommendations:**
- Always inform staff about your allergies
- Ask questions when in doubt
- If you have severe allergies, speak directly with the kitchen

**By continuing, you acknowledge** that you use this system at your own risk and understand that ${restaurantName} is not liable for allergic reactions that may result from food we serve.
          `,
          accept: "I understand and accept responsibility",
          decline: "I do not accept",
          scrollNotice: "Please read the entire disclaimer to the bottom"
        };
    }
  };

  const disclaimerText = getDisclaimerText();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-red-50 px-6 py-4 rounded-t-2xl border-b border-red-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-red-600 text-lg">⚠️</span>
            </div>
            <h2 className="text-lg font-bold text-red-900">
              {disclaimerText.title}
            </h2>
          </div>
        </div>

        {/* Content */}
        <div 
          className="flex-1 overflow-y-auto px-6 py-4"
          onScroll={handleScroll}
        >
          <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
            {disclaimerText.content.split('\n').map((paragraph, index) => {
              if (paragraph.trim() === '') return null;
              
              if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                return (
                  <h3 key={index} className="font-bold text-gray-900 mt-4 mb-2 text-base">
                    {paragraph.slice(2, -2)}
                  </h3>
                );
              }
              
              if (paragraph.startsWith('• ')) {
                return (
                  <div key={index} className="mb-3">
                    <div className="flex items-start gap-2">
                      <span className="text-red-600 font-bold mt-1 text-xs">•</span>
                      <span className="flex-1">
                        {paragraph.slice(2).split('**').map((part, i) => 
                          i % 2 === 1 ? <strong key={i} className="font-semibold">{part}</strong> : part
                        )}
                      </span>
                    </div>
                  </div>
                );
              }
              
              return (
                <p key={index} className="mb-3">
                  {paragraph.split('**').map((part, i) => 
                    i % 2 === 1 ? <strong key={i} className="font-semibold">{part}</strong> : part
                  )}
                </p>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-2xl border-t border-gray-200">
          {!hasScrolledToBottom && (
            <div className="mb-3 text-center">
              <p className="text-sm text-orange-600 font-medium flex items-center justify-center gap-2">
                <span>👇</span>
                {disclaimerText.scrollNotice}
              </p>
            </div>
          )}
          
          <div className="flex gap-3">
            {onDecline && (
              <button
                onClick={onDecline}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors"
              >
                {disclaimerText.decline}
              </button>
            )}
            <button
              onClick={onAccept}
              disabled={!hasScrolledToBottom}
              className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:text-gray-500 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              {disclaimerText.accept}
            </button>
          </div>
          
          {!hasScrolledToBottom && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              Scroll to bottom to enable the accept button
            </p>
          )}
        </div>
      </div>
    </div>
  );
}