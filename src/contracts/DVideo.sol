pragma solidity ^0.5.0;

contract DVideo {
  // Variables
  uint public videoCount = 0;
  string public name = "DVideo";
  mapping(uint => Video) public videos;

  struct Video {
    uint id;
    string hash;
    string title;
    address author;
  }


  // Eventos
  event VideoUploaded(uint id,
    string hash,
    string title,
    address author
  );

  // Constructor
  constructor() public {
  }

  // Funciones
  /**
   * @notice Función que permite subir videos.
   * @param _videoHash Hash del video.
   * @param _title Título del video.
   */
  function uploadVideo(string memory _videoHash, string memory _title) public {
    require(bytes(_videoHash).length > 0, 'Debes insertar el hash del video.');
    require(bytes(_title).length > 0, 'Debes insertar un título para el video.');
    require(msg.sender != address(0), 'La dirección de la persona que quiere añadir el video debe existir.');

    videoCount++;

    videos[videoCount] = Video(videoCount, _videoHash, _title, msg.sender);

    emit VideoUploaded(videoCount, _videoHash, _title, msg.sender);
  }
}
