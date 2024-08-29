# Airwareness

The **Air Supports Toolset** is a comprehensive and versatile application designed to help users maintain optimal indoor air quality and assess the risk of airborne disease transmission. Built with React, this toolset is designed with high compatibility in mind, allowing it to function seamlessly across various platforms, from web browsers to mobile devices. The goal is to provide an accessible, user-friendly interface for evaluating air quality needs and managing health risks in indoor environments.

## Key Features

#### 1. **Indoor Air Quality Management Suite**:  
   This is the overarching suite that encompasses all tools, designed to optimize air quality, safety, and comfort in indoor environments. It’s geared towards both individual room assessments and whole-building management.

   - **Airflow & Ventilation Optimizer**:
     - **Air Purifier Calculator**: This tool determines the ideal number of air purifier units required to achieve the target Air Changes per Hour (ACH) based on room volume, occupancy, and activity levels. It considers both mechanical air purifiers and natural ventilation strategies to provide a holistic view of air management.
     - **Natural Ventilation CADR Estimator**: Integrated into the Air Purifier Calculator, this sub-feature estimates the CADR from natural ventilation based on window size, wind speed, and direction. It helps balance mechanical and natural airflow to optimize indoor air quality.
     - **CO2 Level Estimator**: This component estimates CO2 levels based on the number of occupants, activity levels, and ventilation rate, ensuring that adequate ventilation is maintained to avoid excessive CO2 buildup.
     - **Central Ventilation System**: This feature evaluates the effectiveness of central HVAC systems in maintaining optimal air quality and provides recommendations for adjustments or upgrades.

   - **Transmission Risk & Air Quality Visualizer**:
     - **Transmission Risk Calculator**: This tool assesses the risk of viral transmission in indoor spaces using the Wells-Riley model. It factors in room size, ventilation rates, and the infectiousness of individuals present to provide an estimate of the probability of infection.
     - **Clean Air Visualizer**: A sub-feature within the Transmission Risk Calculator, this visualization tool uses real-time video capture to simulate particle density in the air. By scaling up particles like dust, pollen, or viruses, users can visually grasp the cleanliness of the air and understand the impact on transmission risk.

   - **Building-Wide Environmental Control**:
     - **Room Aggregator**: This meta-feature allows users to save and manage data from multiple rooms across an entire building, providing a comprehensive overview of air quality, ventilation, and transmission risks. It integrates with smart home systems for real-time monitoring and control, allowing users to automate air quality adjustments, receive alerts, and manage their environment remotely via a centralized dashboard.

## High Compatibility

The Air Supports Toolset is designed to be highly adaptable, ensuring it can be deployed and accessed in various environments:

- **Web App**: The core application is built using React, making it easy to deploy on the web and integrate into existing websites, including those built on WordPress or SiteGround.
- **Mobile App**: The toolset is modular and designed with responsive design principles, ensuring that it works well on mobile devices. It can be wrapped using technologies like Cordova or React Native for a native mobile app experience.
- **Offline & Desktop**: By leveraging Progressive Web App (PWA) capabilities or using Electron, the toolset can function as a standalone offline application or be packaged as a desktop app.

## Getting Started

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app). Follow the steps below to get started with development and deployment.

## Install
Navigate to where you want to install the web app and run the following command: 

```bash
git clone <your-repo-url> && cd <your-repo-directory> && yarn install && yarn start
```

### Available Scripts

In the project directory, you can run:

- **`yarn start`**: Launches the app in development mode. Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

- **`yarn test`**: Runs the test suite in interactive watch mode.

- **`yarn build`**: Compiles the app for production, creating optimized bundles in the `build` folder.

- **`yarn eject`**: Removes Create React App’s abstraction layer, giving you full control over configuration.

## Learn More

For further details on how to work with this project or to understand the underlying technologies, please refer to the following resources:

- [React documentation](https://reactjs.org/)
- [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started)
