import { Button, Modal, notification, QRCode } from 'antd'
import React from 'react'
import styles from '../../style.module.css'
interface IQrOrLinkProps {
    isModalVisible: boolean;
    onCancel: () => void;
    selectedEstablishmentId: any;
    userId: any;
}

const QrOrLink:React.FC<IQrOrLinkProps> = ({isModalVisible , onCancel , selectedEstablishmentId , userId}) => {
    const handleCopyLink = () => {
        const linkToCopy = `https://menu.menubyqr.com/${userId}}/${selectedEstablishmentId}`;
        navigator.clipboard.writeText(linkToCopy)
          .then(() => {
            notification.success({ message: 'Link copied to clipboard!' });
          })
          .catch((error) => {
            console.error('Failed to copy the link: ', error);
            notification.error({ message: 'Failed to copy the link', description: error.message });
          });
      };
  return (
    <Modal title="QR or Link" open={isModalVisible} onCancel={onCancel} footer={null}>
      {selectedEstablishmentId && (
        <div className={styles.qrlink}>
          <div className={styles.qr}>
            <QRCode
              className={styles.qrcode}
              errorLevel="H"
              value={`https://menu.menubyqr.com/${userId}/${selectedEstablishmentId}`}/>
          </div>
          <div className={styles.link}>
            <p>QR Link:</p>
            <a className={styles.linklink} href={`https://menu.menubyqr.com/${userId}/${selectedEstablishmentId}`}>
              {`https://menu.menubyqr.com/${userId}/${selectedEstablishmentId}`}
            </a>
            <Button type="primary" className={styles.qrlinkbutton} onClick={handleCopyLink}>
              copy menu link
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}

export default QrOrLink
