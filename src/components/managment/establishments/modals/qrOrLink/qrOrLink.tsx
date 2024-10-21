import { Button, Modal, notification, QRCode } from 'antd';
import React, { useRef } from 'react';
import styles from '../../style.module.css';
import * as htmlToImage from 'html-to-image';

interface IQrOrLinkProps {
  isModalVisible: boolean;
  onCancel: () => void;
  selectedEstablishmentId: any;
  userId: any;
}

const QrOrLink: React.FC<IQrOrLinkProps> = ({ isModalVisible, onCancel, selectedEstablishmentId, userId }) => {
  const qrRef = useRef<HTMLDivElement>(null);

  const handleCopyLink = () => {
    const linkToCopy = `https://menu.menubyqr.com/${userId}/${selectedEstablishmentId}`;
    navigator.clipboard.writeText(linkToCopy)
      .then(() => {
        notification.success({ message: 'Link copied to clipboard!' });
      })
      .catch((error) => {
        console.error('Failed to copy the link: ', error);
        notification.error({ message: 'Failed to copy the link', description: error.message });
      });
  };

  const handleDownloadQrCode = () => {
    if (qrRef.current) {
      htmlToImage.toPng(qrRef.current)
        .then((dataUrl) => {
          const link = document.createElement('a');
          link.href = dataUrl;
          link.download = 'QRCode.png';
          link.click();
        })
        .catch((error) => {
          console.error('Failed to download QR code: ', error);
          notification.error({ message: 'Failed to download QR code', description: error.message });
        });
    }
  };

  return (
    <Modal title="QR or Link" open={isModalVisible} onCancel={onCancel} footer={null}>
      {selectedEstablishmentId && (
        <div className={styles.qrlink}>
          <div className={styles.qr} ref={qrRef}>
            <QRCode
              className={styles.qrcode}
              errorLevel="H"
              value={`https://menu.menubyqr.com/${userId}/${selectedEstablishmentId}`}
            />
            <Button type="default" className={styles.qrlinkbutton} onClick={handleDownloadQrCode} style={{ marginLeft: '8px' , marginTop: '10px' }}>
              Download QR Code
            </Button>
          </div>
          <div className={styles.link}>
            <p>QR Link:</p>
            <a className={styles.linklink} href={`https://menu.menubyqr.com/${userId}/${selectedEstablishmentId}`}>
              {`https://menu.menubyqr.com/${userId}/${selectedEstablishmentId}`}
            </a>
            <Button type="primary" className={styles.qrlinkbutton} onClick={handleCopyLink}>
              Copy Menu Link
            </Button>
            
          </div>
        </div>
      )}
    </Modal>
  );
};

export default QrOrLink;
