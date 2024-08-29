import React from 'react';
import styles from './Tile.module.css';

class BaseTile extends React.Component {
  render() {
    const { title, helptxt, children } = this.props;
    return (
      <div className={styles['tile']}>
        <div className={styles['tile-header-container']}>
          <h3 className={styles['tile-header']}>{title}</h3>
          {helptxt && (
            <div className={styles['help-icon-container']} title={helptxt}>
              <span className={`material-symbols-outlined ${styles['help-icon']}`}>help_outline</span>
            </div>
          )}
        </div>
        <div className={styles['tile-content']}>
          {children}
        </div>
      </div>
    );
  }
}

export default BaseTile;