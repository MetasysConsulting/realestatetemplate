"use client";

type ProtyDetailTemplateSectionsProps = {
  imageUrl: string;
  title: string;
};

/** Extra Proty property-detail-v1 blocks below map (visual parity with ThemeForest template). */
export function ProtyDetailTemplateSections({ imageUrl, title }: ProtyDetailTemplateSectionsProps) {
  return (
    <>
      <div className="wg-property single-property-floor reovana-blur-target">
        <div className="wg-title text-11 fw-6 text-color-heading">Floor plans</div>
        <div className="wrap-floor">
          <div className="box-floor">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="Floor plan" />
          </div>
        </div>
      </div>

      <div className="wg-property box-attachments reovana-blur-target">
        <div className="wg-title text-11 fw-6 text-color-heading">File Attachments</div>
        <div className="attachments-item">
          <a href="#" onClick={(e) => e.preventDefault()}>
            <i className="icon-file-pdf" />
            <span>Property information.pdf</span>
          </a>
        </div>
      </div>

      <div className="wg-property box-virtual-tour reovana-blur-target">
        <div className="wg-title text-11 fw-6 text-color-heading">Virtual Tour</div>
        <div className="image-wrap">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt={`Virtual tour for ${title}`} />
        </div>
      </div>

      <div className="wg-property box-loan reovana-blur-target">
        <div className="wg-title text-11 fw-6 text-color-heading">Get pre-approved</div>
        <p className="text-1">Estimate your monthly payment for this property.</p>
      </div>

      <div className="wg-property single-property-nearby reovana-blur-target">
        <div className="wg-title text-11 fw-6 text-color-heading">What&apos;s nearby?</div>
        <p className="text-1">Schools, transit, and local amenities near this listing.</p>
      </div>
    </>
  );
}
