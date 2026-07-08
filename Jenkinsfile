/*
 * Sample CI/CD pipeline demonstrating SonarQube integration.
 *
 * Prerequisites configured once in Jenkins (Manage Jenkins):
 *   1. "SonarQube Scanner" plugin installed.
 *   2. Manage Jenkins > System > SonarQube servers:
 *        Name           : SonarQube
 *        Server URL     : http://sonarqube:9000  (container-to-container,
 *                          Jenkins and SonarQube share a Docker network here)
 *        Server auth tk : Jenkins credential (Secret text), id "sonarqube-token"
 *   3. Manage Jenkins > Tools > SonarQube Scanner installations:
 *        Name: SonarScanner  (auto-install latest, or point at a local install)
 *   4. In SonarQube: Administration > Configuration > Webhooks, add
 *        http://<jenkins-container-name>:8080/sonarqube-webhook/
 *      This is what lets waitForQualityGate() below get an instant
 *      callback instead of polling.
 */

pipeline {
    agent any

    environment {
        APP_DIR = 'sample-app'
    }

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                dir(APP_DIR) {
                    sh 'npm ci'
                }
            }
        }

        stage('Unit Tests & Coverage') {
            steps {
                dir(APP_DIR) {
                    sh 'npm test'
                }
            }
            post {
                always {
                    junit allowEmptyResults: true, testResults: "${APP_DIR}/reports/junit/*.xml"
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                dir(APP_DIR) {
                    withSonarQubeEnv('SonarQube') {
                        script {
                            def scannerHome = tool 'SonarScanner'
                            sh "${scannerHome}/bin/sonar-scanner -Dproject.settings=sonar-project.properties"
                        }
                    }
                }
            }
        }

        stage('Quality Gate') {
            steps {
                // Pauses the pipeline (no polling) until SonarQube posts the
                // analysis result back via the webhook, then fails the build
                // if the gate status is not OK.
                timeout(time: 10, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('Publish Reports') {
            steps {
                dir(APP_DIR) {
                    archiveArtifacts artifacts: 'coverage/lcov-report/**', allowEmptyArchive: true
                    publishHTML(target: [
                        reportDir: 'coverage/lcov-report',
                        reportFiles: 'index.html',
                        reportName: 'Code Coverage Report',
                        keepAll: true,
                        alwaysLinkToLastBuild: true,
                        allowMissing: true
                    ])
                }
            }
        }

        stage('Build Artifact') {
            steps {
                dir(APP_DIR) {
                    sh 'tar -czf sonar-demo-app.tar.gz src package.json'
                }
                archiveArtifacts artifacts: "${APP_DIR}/sonar-demo-app.tar.gz", fingerprint: true
            }
        }

        stage('Deploy') {
            when {
                branch 'main'
            }
            steps {
                echo 'Placeholder deploy step — wire this up to your target environment.'
            }
        }
    }

    post {
        success {
            echo 'Pipeline passed: tests green and SonarQube Quality Gate OK.'
        }
        failure {
            echo 'Pipeline failed — check the Unit Tests, SonarQube Analysis, or Quality Gate stage logs above.'
        }
    }
}
