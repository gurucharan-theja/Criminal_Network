@REM ----------------------------------------------------------------------------
@REM Maven Wrapper startup batch script
@REM ----------------------------------------------------------------------------
@IF "%__MVNW_ARG0_NAME__%"=="" (SET __MVNW_ARG0_NAME__=%~nx0)
@SET __ MVNW_CMD__=
@SETLOCAL

@SET MAVEN_PROJECTBASEDIR=%~dp0
@IF NOT "%MAVEN_BASEDIR%"=="" SET MAVEN_PROJECTBASEDIR=%MAVEN_BASEDIR%

@SET MVNW_REPOURL=https://repo.maven.apache.org/maven2
@SET MVNW_DISTRIBUTION_VERSION=3.9.6
@SET MVNW_DISTRIBUTION=apache-maven-%MVNW_DISTRIBUTION_VERSION%
@SET MVNW_DISTRIBUTION_URL=%MVNW_REPOURL%/org/apache/maven/%MVNW_DISTRIBUTION%/%MVNW_DISTRIBUTION_VERSION%/%MVNW_DISTRIBUTION%-bin.zip

@SET MAVEN_USER_HOME=%USERPROFILE%\.m2
@SET MVNW_HOME=%MAVEN_USER_HOME%\wrapper\dists\%MVNW_DISTRIBUTION%

@IF EXIST "%MVNW_HOME%\apache-maven-%MVNW_DISTRIBUTION_VERSION%\bin\mvn.cmd" (
    @SET MVN_CMD="%MVNW_HOME%\apache-maven-%MVNW_DISTRIBUTION_VERSION%\bin\mvn.cmd"
    GOTO run
)

@ECHO Maven not found in wrapper cache. Downloading...
@IF NOT EXIST "%MVNW_HOME%" MKDIR "%MVNW_HOME%"

@SET MVNW_ZIP=%MVNW_HOME%\%MVNW_DISTRIBUTION%-bin.zip

powershell -Command "Invoke-WebRequest -Uri '%MVNW_DISTRIBUTION_URL%' -OutFile '%MVNW_ZIP%'"

@IF NOT EXIST "%MVNW_ZIP%" (
    @ECHO ERROR: Failed to download Maven. Check your internet connection.
    EXIT /B 1
)

powershell -Command "Expand-Archive -Path '%MVNW_ZIP%' -DestinationPath '%MVNW_HOME%' -Force"
DEL "%MVNW_ZIP%"

@ECHO Maven downloaded successfully.

:run
@SET MVN_CMD="%MVNW_HOME%\apache-maven-%MVNW_DISTRIBUTION_VERSION%\bin\mvn.cmd"
@SET MAVEN_OPTS=%MAVEN_OPTS%
%MVN_CMD% %*
