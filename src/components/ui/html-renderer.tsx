
import parse, { DOMNode, Element, attributesToProps } from 'html-react-parser';
import { SafeImage } from './safe-image'; // Thay đổi đường dẫn đến SafeImage của bạn

interface HtmlRendererProps {
  htmlContent: string;
}

const replaceImgTag = (node: DOMNode) => {
  if (node instanceof Element && node.name === 'img') {
    const { src, alt, width, height, ...rest } = attributesToProps(node.attribs);
    
    // TinyMCE có thể lưu width/height dưới dạng string, cần chuyển đổi sang number
    const imgWidth = width ? parseInt(width as any, 10) : undefined;
    const imgHeight = height ? parseInt(height as any, 10) : undefined;
    
    // Nếu có width và height hợp lệ, dùng chúng
    const props = {
      src: src,
      alt: alt || '',
      width: imgWidth || 500,  // Cung cấp giá trị mặc định nếu không có, NextImage cần width/height
      height: imgHeight || 300, 
      sizes: '(max-width: 768px) 100vw, 50vw',
      style: {
        maxWidth: '100%',
        height: 'auto',
      },
      ...rest // Giữ lại các thuộc tính khác như class, style, data-...
    };

    // Kiểm tra xem có đủ props cho SafeImage (NextImage) không
    if (props.src && props.width && props.height) {
        return <SafeImage {...props as any} />;
    }
    
    // Nếu thiếu src, width hoặc height, trả về thẻ <img> gốc
    return node;
  }
};

export function HtmlRenderer({ htmlContent }: HtmlRendererProps) {
  const options = {
    replace: (node: DOMNode) => {
      // Thay thế tất cả thẻ <img>
      const imageElement = replaceImgTag(node);
      if (imageElement) return imageElement;
      
      // Có thể thêm logic thay thế cho thẻ <a>, <table>, v.v. ở đây
      
      return node;
    },
  };

  return <div className="html-content-wrapper">{parse(htmlContent, options)}</div>;
}