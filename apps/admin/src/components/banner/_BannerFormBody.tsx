"use client";

// Render body for BannerForm — composes all section components and
// receives all required state via a single `state` prop.

import { BannerColorSection } from "./_BannerColorSection";
import { BannerFormSettings } from "./_BannerFormSettings";
import { BannerImageSection } from "./_BannerImageSection";
import { BannerLinkSection } from "./_BannerLinkSection";

import type { useBannerFormState } from "./_useBannerFormState";

type State = ReturnType<typeof useBannerFormState>;

export function BannerFormBody({ state }: { state: State }) {
  const {
    formData,
    categories,
    products,
    updateFormData,
    desktopLoadingState,
    mobileLoadingState,
    categoryOpen,
    setCategoryOpen,
    productOpen,
    setProductOpen,
    linkType,
    isPickingColor,
    setIsPickingColor,
    isPickingMobileColor,
    setIsPickingMobileColor,
    desktopInputId,
    mobileInputId,
    handleColorPick,
    handleMobileColorPick,
    handleLinkTypeChange,
    handleDesktopFileChange,
    handleMobileFileChange,
  } = state;

  return (
    <div className="bg-white rounded-lg border p-4 sm:p-6 space-y-6 max-w-2xl">
      <BannerImageSection
        label="Desktop зураг"
        helpText="Компьютер дээр харагдах зураг (1900x410px)"
        inputId={desktopInputId}
        imageUrl={formData.image_url}
        loadingState={desktopLoadingState}
        isPicking={isPickingColor}
        maxHeightClass="max-h-48"
        iconSize="lg"
        emptyText="Desktop зургаа энд дарж эсвэл зөөж оруулна уу."
        onFileChange={handleDesktopFileChange}
        onColorPickClick={handleColorPick}
        onRemove={() => updateFormData({ image_url: "", background_color: "#ffffff" })}
      />

      <BannerImageSection
        label="Mobile зураг"
        helpText="Гар утсан дээр харагдах зураг (заавал биш)"
        inputId={mobileInputId}
        imageUrl={formData.mobile_image_url}
        loadingState={mobileLoadingState}
        isPicking={isPickingMobileColor}
        maxHeightClass="max-h-48"
        iconSize="md"
        emptyText="Mobile зургаа энд дарж оруулна уу."
        onFileChange={handleMobileFileChange}
        onColorPickClick={handleMobileColorPick}
        onRemove={() =>
          updateFormData({
            mobile_image_url: null,
            mobile_background_color: null,
          })
        }
      />

      <BannerColorSection
        label="Desktop дэвсгэр өнгө"
        color={formData.background_color}
        showColorPickerButton={!!formData.image_url}
        isPicking={isPickingColor}
        pickerButtonLabel={{
          desktop: "Зураг дээрээс сонгоно уу",
          mobile: "Зургаас сонгох",
        }}
        pickHintText="Зураг дээр дарж өнгө сонгоно уу"
        onColorChange={(value) => updateFormData({ background_color: value ?? "#ffffff" })}
        onTogglePicking={() => setIsPickingColor(!isPickingColor)}
      />

      <BannerColorSection
        label="Mobile дэвсгэр өнгө"
        helpText="Гар утсан дээр харагдах өнгө (заавал биш)"
        color={formData.mobile_background_color}
        showColorPickerButton={!!formData.mobile_image_url}
        isPicking={isPickingMobileColor}
        pickerButtonLabel={{
          desktop: "Сонгоно уу",
          mobile: "Зургаас",
        }}
        pickHintText="Mobile зураг дээр дарж өнгө сонгоно уу"
        showClearButton
        onColorChange={(value) => updateFormData({ mobile_background_color: value })}
        onTogglePicking={() => setIsPickingMobileColor(!isPickingMobileColor)}
      />

      <BannerLinkSection
        linkType={linkType}
        categories={categories}
        products={products}
        formData={formData}
        categoryOpen={categoryOpen}
        setCategoryOpen={setCategoryOpen}
        productOpen={productOpen}
        setProductOpen={setProductOpen}
        onLinkTypeChange={handleLinkTypeChange}
        onSelectCategory={(id) => {
          updateFormData({
            category_id: id,
            product_id: null,
            link_url: null,
          });
          setCategoryOpen(false);
        }}
        onSelectProduct={(id) => {
          updateFormData({
            product_id: id,
            category_id: null,
            link_url: null,
          });
          setProductOpen(false);
        }}
        onLinkUrlChange={(url) => updateFormData({ link_url: url })}
      />

      <BannerFormSettings
        type={formData.type}
        onTypeChange={(t) => updateFormData({ type: t })}
        sortOrder={formData.sort_order}
        onSortOrderChange={(n) => updateFormData({ sort_order: n })}
        isActive={formData.is_active}
        onIsActiveChange={(checked) => updateFormData({ is_active: checked })}
      />
    </div>
  );
}
